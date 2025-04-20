import { Navigate, Route, Routes } from "react-router-dom";
import SetupWorkspace from "@/pages/auth/setup-workspace.tsx";
import LoginPage from "@/pages/auth/login";
import Home from "@/pages/dashboard/home";
import Page from "@/pages/page/page";
import AccountSettings from "@/pages/settings/account/account-settings";
import WorkspaceMembers from "@/pages/settings/workspace/workspace-members";
import WorkspaceSettings from "@/pages/settings/workspace/workspace-settings";
import Groups from "@/pages/settings/group/groups";
import GroupInfo from "./pages/settings/group/group-info";
import Spaces from "@/pages/settings/space/spaces.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import AccountPreferences from "@/pages/settings/account/account-preferences.tsx";
import SpaceHome from "@/pages/space/space-home.tsx";
import PageRedirect from "@/pages/page/page-redirect.tsx";
import Layout from "@/components/layouts/global/layout.tsx";
import { ErrorBoundary } from "react-error-boundary";
import InviteSignup from "@/pages/auth/invite-signup.tsx";
import ForgotPassword from "@/pages/auth/forgot-password.tsx";
import PasswordReset from "./pages/auth/password-reset";
import Billing from "@/ee/billing/pages/billing.tsx";
import CloudLogin from "@/ee/pages/cloud-login.tsx";
import CreateWorkspace from "@/ee/pages/create-workspace.tsx";
import { isCloud } from "@/lib/config.ts";
import { useTranslation } from "react-i18next";
import Security from "@/ee/security/pages/security.tsx";
import License from "@/ee/licence/pages/license.tsx";
import { useRedirectToCloudSelect } from "@/ee/hooks/use-redirect-to-cloud-select.tsx";
import AttachmentsPage from "@/features/attachment/pages/attachments-page.tsx";
import { useMCPEvents } from "@/features/websocket/hooks/use-mcp-events";
import NavigationTestPage from "@/features/websocket/pages/navigation-test-page.tsx";

export default function App() {
  const { t } = useTranslation();
  useRedirectToCloudSelect();

  // Initialize MCP events handling (including navigation events)
  useMCPEvents();

  return (
    <>
      <Routes>
        <Route index element={<Navigate to="/home" />} />
        <Route path={"/login"} element={<LoginPage />} />
        <Route path={"/invites/:invitationId"} element={<InviteSignup />} />
        <Route path={"/forgot-password"} element={<ForgotPassword />} />
        <Route path={"/password-reset"} element={<PasswordReset />} />

        {!isCloud() && (
          <Route path={"/setup/register"} element={<SetupWorkspace />} />
        )}

        {isCloud() && (
          <>
            <Route path={"/create"} element={<CreateWorkspace />} />
            <Route path={"/select"} element={<CloudLogin />} />
          </>
        )}

        <Route path={"/p/:pageSlug"} element={<PageRedirect />} />

        <Route element={<Layout />}>
          <Route path={"/home"} element={<Home />} />
          <Route path={"/s/:spaceSlug/home"} element={<SpaceHome />} />
          <Route path={"/s/:spaceSlug/p/:pageSlug"} element={<Page />} />
          <Route path={"/files"} element={<AttachmentsPage />} />

          <Route
            path={"/settings/account/profile"}
            element={<AccountSettings />}
          />
          <Route
            path={"/settings/account/preferences"}
            element={<AccountPreferences />}
          />
          <Route path={"/settings/workspace"} element={<WorkspaceSettings />} />
          <Route path={"/settings/members"} element={<WorkspaceMembers />} />
          <Route path={"/settings/groups"} element={<Groups />} />
          <Route path={"/settings/groups/:groupId"} element={<GroupInfo />} />
          <Route path={"/settings/spaces"} element={<Spaces />} />
          <Route path={"/settings/billing"} element={<Billing />} />
          <Route path={"/settings/security"} element={<Security />} />
          <Route path={"/settings/license"} element={<License />} />
          <Route path={"/navigation-test"} element={<NavigationTestPage />} />
          <Route path={"*"} element={<Error404 />} />
        </Route>
      </Routes>
    </>
  );
}
