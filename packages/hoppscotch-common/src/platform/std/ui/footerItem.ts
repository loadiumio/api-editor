import { HoppFooterMenuItem } from "../../ui"
import IconGift from "~icons/lucide/gift"
import IconActivity from "~icons/lucide/activity"

export const whatsNew: HoppFooterMenuItem = {
  id: "whats-new",
  text: (t) => t("app.whats_new"),
  icon: IconGift,
  action: {
    type: "link",
    href: "",
  },
}

export const status: HoppFooterMenuItem = {
  id: "status",
  text: (t) => t("app.status"),
  icon: IconActivity,
  action: {
    type: "link",
    href: "",
  },
}

export const stdFooterItems = [whatsNew, status]
