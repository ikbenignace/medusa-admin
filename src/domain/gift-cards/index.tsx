import { Router } from "@reach/router"
import { useAdminProducts } from "medusa-react"
import qs from "query-string"
import React, { useContext, useEffect } from "react"
import PlusIcon from "../../components/fundamentals/icons/plus-icon"
import Breadcrumb from "../../components/molecules/breadcrumb"
import BodyCard from "../../components/organisms/body-card"
import GiftCardTable from "../../components/templates/gift-card-table"
import { InterfaceContext } from "../../context/interface"
import ManageGiftCard from "./manage"

const Index = ({ giftCards }) => {
  const searchQuery = (q) => {
    const baseUrl = qs.parseUrl(window.location.href).url

    const search = {
      fields: "id,title,thumbnail",
      expand: "variants,variants.prices,collection",
      q,
      offset: 0,
      limit: 20,
    }

    const prepared = qs.stringify(search, {
      skipNull: true,
      skipEmptyString: true,
    })

    window.history.replaceState(baseUrl, "", `?${prepared}`)
    // TODO: Refresh
  }

  const actionables = [
    {
      label: "Custom Gift Card",
      onClick: () => console.log("create custom gift card"), // TODO: open modal
      icon: <PlusIcon size={20} />,
    },
  ]

  const { setOnSearch, onUnmount } = useContext(InterfaceContext)
  useEffect(onUnmount, [])
  useEffect(() => {
    setOnSearch(searchQuery)
  }, [])

  return (
    <div className="flex flex-col grow h-full">
      <div className="w-full flex flex-col grow">
        <Breadcrumb
          previousRoute="/a/settings"
          previousBreadcrumb="Settings"
          currentPage="The Team"
        />
        <BodyCard
          title="History"
          subtitle="See the history of purchased gift cards"
          actionables={actionables}
        >
          <GiftCardTable giftCards={giftCards} />
        </BodyCard>
      </div>
    </div>
  )
}

const GiftCard = () => {
  const { products: giftCards } = useAdminProducts({ is_giftcard: "true" })

  return (
    <Router>
      <Index path="/" giftCards={giftCards} />
      {giftCards?.length && (
        <ManageGiftCard path="manage" id={giftCards[0].id} />
      )}
    </Router>
  )
}

export default GiftCard
