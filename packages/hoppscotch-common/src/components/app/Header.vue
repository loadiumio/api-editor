<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
import { useI18n } from "@composables/i18n"
import { useReadonlyStream } from "@composables/stream"
import { defineActionHandler, invokeAction } from "@helpers/actions"
import { useNetwork } from "@vueuse/core"
import { useService } from "dioc/vue"
import { computed, reactive, ref, watch } from "vue"
import { useToast } from "~/composables/toast"
import { GetMyTeamsQuery, TeamMemberRole } from "~/helpers/backend/graphql"
import { platform } from "~/platform"
import {
  BANNER_PRIORITY_LOW,
  BannerContent,
  BannerService,
} from "~/services/banner.service"
import { WorkspaceService } from "~/services/workspace.service"

const t = useI18n()
const toast = useToast()

/**
 * Feature flag to enable the workspace selector login conversion
 */
/*const workspaceSelectorFlagEnabled = computed(
  () => !!platform.platformFeatureFlags.workspaceSwitcherLogin?.value
)*/

/**
 * Once the PWA code is initialized, this holds a method
 * that can be called to show the user the installation
 * prompt.
 */

/*const showInstallButton = computed(() => !!pwaDefferedPrompt.value)

const showTeamsModal = ref(false)

const breakpoints = useBreakpoints(breakpointsTailwind)
const mdAndLarger = breakpoints.greater("md")*/

const banner = useService(BannerService)
/*const bannerContent = computed(() => banner.content.value?.content)*/
let offlineBannerID: number | null = null

const offlineBanner: BannerContent = {
  type: "warning",
  text: (t) => t("helpers.offline"),
  alternateText: (t) => t("helpers.offline_short"),
  score: BANNER_PRIORITY_LOW,
  dismissible: true,
}

// Show the offline banner if the app is offline
const network = reactive(useNetwork())
const isOnline = computed(() => network.isOnline)

watch(isOnline, () => {
  if (!isOnline.value) {
    offlineBannerID = banner.showBanner(offlineBanner)
    return
  }
  if (banner.content && offlineBannerID) {
    banner.removeBanner(offlineBannerID)
  }
})

/*const dismissBanner = () => {
  if (banner.content.value) {
    banner.removeBanner(banner.content.value.id)
  } else if (offlineBannerID) {
    banner.removeBanner(offlineBannerID)
    offlineBannerID = null
  }
}*/

const currentUser = useReadonlyStream(
  platform.auth.getProbableUserStream(),
  platform.auth.getProbableUser()
)

const confirmRemove = ref(false)
const teamID = ref<string | null>(null)

const selectedTeam = ref<GetMyTeamsQuery["myTeams"][number] | undefined>()

// TeamList-Adapter
const workspaceService = useService(WorkspaceService)
const teamListAdapter = workspaceService.acquireTeamListAdapter(null)
const myTeams = useReadonlyStream(teamListAdapter.teamList$, null)

const workspace = workspaceService.currentWorkspace

/*const workspaceName = computed(() => {
  return workspace.value.type === "personal"
    ? t("workspace.personal")
    : workspace.value.teamName
})

const refetchTeams = () => {
  teamListAdapter.fetchList()
}*/

watch(
  () => myTeams.value,
  (newTeams) => {
    const space = workspace.value

    if (newTeams && space.type === "team" && space.teamID) {
      const team = newTeams.find((team) => team.id === space.teamID)
      if (team) {
        selectedTeam.value = team
        // Update the workspace name if it's not the same as the updated team name
        if (team.name !== space.teamName) {
          workspaceService.updateWorkspaceTeamName(team.name)
        }
      }
    }
  }
)

watch(
  () => workspace.value,
  (newWorkspace) => {
    if (newWorkspace.type === "team") {
      const team = myTeams.value?.find((t) => t.id === newWorkspace.teamID)
      if (team) {
        selectedTeam.value = team
      }
    }
  }
)

const showModalInvite = ref(false)
const showModalEdit = ref(false)

const editingTeamName = ref<{ name: string }>({ name: "" })
const editingTeamID = ref("")

const displayModalInvite = (show: boolean) => {
  showModalInvite.value = show
}

const displayModalEdit = (show: boolean) => {
  showModalEdit.value = show
  teamListAdapter.fetchList()
}

const inviteTeam = (team: { name: string }, teamID: string) => {
  editingTeamName.value = team
  editingTeamID.value = teamID
  displayModalInvite(true)
}

// Show the workspace selected team invite modal if the user is an owner of the team else show the default invite modal
/*const handleInvite = () => {
  if (!currentUser.value) return invokeAction("modals.login.toggle")

  if (
    workspace.value.type === "team" &&
    workspace.value.teamID &&
    selectedTeam.value?.myRole === "OWNER"
  ) {
    editingTeamID.value = workspace.value.teamID
    displayModalInvite(true)
  } else {
    showTeamsModal.value = true
  }
}*/

// Show the workspace selected team edit modal if the user is an owner of the team
const handleTeamEdit = () => {
  if (
    workspace.value.type === "team" &&
    workspace.value.teamID &&
    selectedTeam.value?.myRole === "OWNER"
  ) {
    editingTeamID.value = workspace.value.teamID
    editingTeamName.value = { name: selectedTeam.value.name }
    displayModalEdit(true)
  } else {
    noPermission()
  }
}

/*const deleteTeam = () => {
  if (!teamID.value) return
  pipe(
    backendDeleteTeam(teamID.value),
    TE.match(
      (err) => {
        // TODO: Better errors ? We know the possible errors now
        toast.error(`${t("error.something_went_wrong")}`)
        console.error(err)
      },
      () => {
        invokeAction("workspace.switch.personal")
        toast.success(`${t("team.deleted")}`)
      }
    )
  )() // Tasks (and TEs) are lazy, so call the function returned
}*/

// Template refs
/*const tippyActions = ref<any | null>(null)
const profile = ref<any | null>(null)
const settings = ref<any | null>(null)
const logout = ref<any | null>(null)
const accountActions = ref<any | null>(null)*/

defineActionHandler("modals.team.edit", handleTeamEdit)

defineActionHandler("modals.team.invite", () => {
  if (
    selectedTeam.value?.myRole === "OWNER" ||
    selectedTeam.value?.myRole === "EDITOR"
  ) {
    inviteTeam({ name: selectedTeam.value.name }, selectedTeam.value.id)
  } else {
    noPermission()
  }
})

defineActionHandler(
  "user.login",
  () => {
    invokeAction("modals.login.toggle")
  },
  computed(() => !currentUser.value)
)

defineActionHandler("modals.team.delete", ({ teamId }) => {
  if (selectedTeam.value?.myRole !== TeamMemberRole.Owner) return noPermission()
  teamID.value = teamId
  confirmRemove.value = true
})

const noPermission = () => {
  toast.error(`${t("profile.no_permission")}`)
}
</script>
