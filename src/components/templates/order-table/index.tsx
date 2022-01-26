import { RouteComponentProps, useLocation } from "@reach/router"
import { isEmpty } from "lodash"
import { useAdminOrders } from "medusa-react"
import moment from "moment"
import qs from "query-string"
import React, { useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"
import { usePagination, useTable } from "react-table"
import { useDebounce } from "../../../hooks/use-debounce"
import { formatAmountWithSymbol } from "../../../utils/prices"
import { removeNullish } from "../../../utils/remove-nullish"
import Spinner from "../../atoms/spinner"
import StatusDot from "../../fundamentals/status-indicator"
import CustomerAvatarItem from "../../molecules/customer-avatar-item"
import Table, { TablePagination } from "../../molecules/table"
import OrderFilters from "../order-filter-dropdown"

const getColor = (index: number): string => {
  const colors = [
    "bg-fuschia-40",
    "bg-pink-40",
    "bg-orange-40",
    "bg-teal-40",
    "bg-cyan-40",
    "bg-blue-40",
    "bg-indigo-40",
  ]
  return colors[index % colors.length]
}

type OrderFilter = {
  open: boolean
  filter: string | null
}

const defaultQueryProps = {
  expand: "shipping_address",
  fields:
    "id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code",
}

const OrderTable: React.FC<RouteComponentProps> = () => {
  const location = useLocation()

  const [filters, setFilters] = useState({})
  const [statusFilter, setStatusFilter] = useState<OrderFilter>({
    open: false,
    filter: null,
  })
  const [fulfillmentFilter, setFulfillmentFilter] = useState<OrderFilter>({
    open: false,
    filter: null,
  })
  const [paymentFilter, setPaymentFilter] = useState<OrderFilter>({
    open: false,
    filter: null,
  })
  const [dateFilter, setDateFilter] = useState<OrderFilter>({
    open: false,
    filter: null,
  })

  useEffect(() => {
    const filtersOnLoad = qs.parse(location.search)

    if (filtersOnLoad.status?.length) {
      setStatusFilter({
        open: true,
        filter: filtersOnLoad.status[0],
      })
    }
    if (filtersOnLoad.fulfillment_status?.length) {
      setFulfillmentFilter({
        open: true,
        filter: filtersOnLoad.fulfillment_status[0],
      })
    }
    if (filtersOnLoad.payment_status?.length) {
      setPaymentFilter({
        open: true,
        filter: filtersOnLoad.payment_status[0],
      })
    }

    if (filtersOnLoad.q) {
      setQuery(filtersOnLoad.q)
    }

    // TODO: Check if created at is in query on load
    if (filtersOnLoad.created_at) {
      setDateFilter({
        open: true,
        filter: filtersOnLoad.created_at,
      })
    }

    setFilters({
      ...filtersOnLoad,
      limit: filtersOnLoad?.limit ? parseInt(filtersOnLoad.limit) : 14,
      offset: filtersOnLoad?.offset ? parseInt(filtersOnLoad.offset) : 0,
    })
  }, [])

  const [query, setQuery] = useState()
  const [currentPage, setCurrentPage] = useState(0)
  const [numPages, setNumPages] = useState(0)

  const decideStatus = (status) => {
    switch (status) {
      case "captured":
        return <StatusDot variant="success" title={"Paid"} />
      case "awaiting":
        return <StatusDot variant="warning" title={"Awaiting"} />
      case "requires":
        return <StatusDot variant="danger" title={"Requires action"} />
      default:
        return <StatusDot variant="primary" title={"N/A"} />
    }
  }

  const columns = useMemo(
    () => [
      {
        Header: "Order",
        accessor: "display_id",
        Cell: ({ cell: { value } }) => <Table.Cell>{`#${value}`}</Table.Cell>,
      },
      {
        Header: "Date added",
        accessor: "created_at",
        Cell: ({ cell: { value } }) => (
          <Table.Cell>{moment(value).format("DD MMM YYYY")}</Table.Cell>
        ),
      },
      {
        Header: "Customer",
        accessor: "shipping_address",
        Cell: ({ row, cell: { value } }) => (
          <Table.Cell>
            <CustomerAvatarItem
              customer={{
                first_name: value.first_name,
                last_name: value.last_name,
              }}
              color={getColor(row.index)}
            />
          </Table.Cell>
        ),
      },
      {
        Header: "Fulfillment",
        accessor: "fulfillment_status",
        Cell: ({ cell: { value } }) => <Table.Cell>{value}</Table.Cell>,
      },
      {
        Header: "Payment status",
        accessor: "payment_status",
        Cell: ({ cell: { value } }) => (
          <Table.Cell>{decideStatus(value)}</Table.Cell>
        ),
      },
      {
        Header: () => <div className="text-right">Total</div>,
        accessor: "total",
        Cell: ({ row, cell: { value } }) => (
          <Table.Cell>
            <div className="text-right">
              {formatAmountWithSymbol({
                amount: value,
                currency: row.original.currency_code,
                digits: 2,
              })}
            </div>
          </Table.Cell>
        ),
      },
      {
        Header: "",
        accessor: "currency_code",
        Cell: ({ cell: { value } }) => (
          <Table.Cell className="w-[5%]">
            <div className="text-right text-grey-40">{value.toUpperCase()}</div>
          </Table.Cell>
        ),
      },
      {
        Header: "",
        accessor: "country_code",
        Cell: ({ row }) => (
          <Table.Cell className="w-[5%]">
            <div className="flex w-full justify-end">
              <ReactCountryFlag
                svg
                countryCode={row.original.shipping_address.country_code}
              />
            </div>
          </Table.Cell>
        ),
      },
    ],
    []
  )

  const debouncedSearchTerm = useDebounce(query, 500)

  const { orders, isLoading, isRefetching, count } = useAdminOrders({
    ...defaultQueryProps,
    ...filters,
  })

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    nextPage,
    previousPage,
    // Get the state from the instance
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: orders || [],
      manualPagination: true,
      initialState: {
        pageIndex: currentPage,
        pageSize: filters.limit ?? 14,
      },
      pageCount: numPages,
      autoResetPage: false,
    },
    usePagination
  )

  useEffect(() => {
    const controlledPageCount = Math.ceil(count! / filters.limit)
    setNumPages(controlledPageCount)
  }, [orders])

  const handleNext = () => {
    if (canNextPage) {
      console.log(filters.offset, pageSize)
      setFilters({ ...filters, offset: filters.offset + pageSize })
      setCurrentPage((old) => old + 1)
      nextPage()
    }
  }

  const handlePrev = () => {
    if (canPreviousPage) {
      setFilters({ ...filters, offset: filters.offset - pageSize })
      setCurrentPage((old) => old - 1)
      previousPage()
    }
  }

  // Upon searching, we reset all other filters
  const handleSearch = (q) => {
    setFilters({ offset: 0, limit: filters.limit ?? 14 })
    setCurrentPage(0)
    setQuery(q)
  }

  const atMidnight = (date) => {
    const result = moment(date)
    if (!moment.isMoment(result)) {
      return null
    }
    result.hour(0)
    result.minute(0)
    result.second(0)
    result.millisecond(0)

    return result
  }

  const relativeDateFormatToTimestamp = (value) => {
    const [count, option] = value.split("|")
    // relative days are always subtract
    let date = moment()

    date.subtract(count, option)
    date = atMidnight(date)!

    console.log(date)

    const result = `${date.format("X")}`

    return result
  }

  const formatDateFilter = (filter) => {
    return Object.entries(filter).reduce((acc, [key, value]) => {
      if (value.includes("|")) {
        acc[key] = relativeDateFormatToTimestamp(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {})
  }

  const updateUrl = (obj = {}) => {
    const stringified = qs.stringify(obj)
    window.history.replaceState(`/a/orders`, "", `${`?${stringified}`}`)
  }

  const refreshWithFilters = (queryObject) => {
    const searchObject = {
      ...queryObject,
      ...defaultQueryProps,
    }

    if (isEmpty(queryObject)) {
      resetFilters()
      updateUrl({ offset: filters.offset, limit: filters.limit })
      setFilters({ ...defaultQueryProps })
    } else {
      if (!searchObject.offset) {
        searchObject.offset = 0
      }

      if (!searchObject.limit) {
        searchObject.limit = 14
      }

      updateUrl(queryObject)
      setFilters({ ...searchObject })
    }
  }

  const submitFilters = () => {
    let urlObject = {
      "payment_status[]": paymentFilter.filter,
      "fulfillment_status[]": fulfillmentFilter.filter,
      "status[]": statusFilter.filter,
    }

    if (!isEmpty(dateFilter.filter) && dateFilter.open) {
      const dateFormatted = formatDateFilter(dateFilter.filter)

      const dateFilters = Object.entries(dateFormatted).reduce(
        (acc, [key, value]) => {
          return {
            ...acc,
            [`created_at[${key}]`]: value,
          }
        },
        {}
      )

      urlObject = {
        ...urlObject,
        ...dateFilters,
      }
    }

    console.log(urlObject)

    refreshWithFilters(removeNullish(urlObject))
  }

  const resetFilters = () => {
    setStatusFilter({
      open: false,
      filter: null,
    })
    setFulfillmentFilter({
      open: false,
      filter: null,
    })
    setPaymentFilter({
      open: false,
      filter: null,
    })
    setDateFilter({
      open: false,
      filter: null,
    })
  }

  const clearFilters = () => {
    resetFilters()
    refreshWithFilters({ limit: 14, offset: 0 })
  }

  useEffect(() => {
    if (debouncedSearchTerm) {
      refreshWithFilters({ q: query })
    }
  }, [debouncedSearchTerm])

  return (
    <div className="w-full h-full overflow-y-scroll flex flex-col justify-between">
      {isLoading || isRefetching || !orders ? (
        <div className="w-full pt-2xlarge flex items-center justify-center">
          <Spinner size={"large"} variant={"secondary"} />
        </div>
      ) : (
        <>
          <Table
            filteringOptions={
              <OrderFilters
                setStatusFilter={setStatusFilter}
                statusFilter={statusFilter}
                setFulfillmentFilter={setFulfillmentFilter}
                fulfillmentFilter={fulfillmentFilter}
                setPaymentFilter={setPaymentFilter}
                paymentFilter={paymentFilter}
                setDateFilter={setDateFilter}
                dateFilter={dateFilter}
                submitFilters={submitFilters}
                resetFilters={resetFilters}
                clearFilters={clearFilters}
              />
            }
            enableSearch
            handleSearch={handleSearch}
            {...getTableProps()}
          >
            <Table.Head>
              {headerGroups?.map((headerGroup) => (
                <Table.HeadRow {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((col) => (
                    <Table.HeadCell
                      className="w-[100px]"
                      {...col.getHeaderProps()}
                    >
                      {col.render("Header")}
                    </Table.HeadCell>
                  ))}
                </Table.HeadRow>
              ))}
            </Table.Head>
            <Table.Body {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row)
                return (
                  <Table.Row
                    color={"inherit"}
                    linkTo={row.original.id}
                    {...row.getRowProps()}
                  >
                    {row.cells.map((cell, index) => {
                      return cell.render("Cell", { index })
                    })}
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
          <TablePagination
            count={count!}
            limit={filters.limit}
            offset={filters.offset}
            pageSize={filters.offset + rows.length}
            title="Orders"
            currentPage={pageIndex}
            pageCount={pageCount}
            nextPage={handleNext}
            prevPage={handlePrev}
            hasNext={canNextPage}
            hasPrev={canPreviousPage}
          />
        </>
      )}
    </div>
  )
}

export default OrderTable
