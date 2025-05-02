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
import { ProjectManagementPage } from "@/features/project/pages/project-management-page.tsx";
import { TasksPage } from "@/features/project/pages/tasks-page.tsx";
import { useEffect } from "react";

// CSS for Project 89 themes
const project89CSS = `
  /* Core Font Imports */
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
  
  /* Animations */
  @keyframes scanline {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }
  
  @keyframes textShadowPulse {
    0% {
      text-shadow: 0 0 4px var(--mantine-primary-color-filled), 0 0 8px var(--mantine-primary-color-filled);
    }
    50% {
      text-shadow: 0 0 4px var(--mantine-primary-color-filled), 0 0 12px var(--mantine-primary-color-filled), 0 0 16px var(--mantine-primary-color-filled);
    }
    100% {
      text-shadow: 0 0 4px var(--mantine-primary-color-filled), 0 0 8px var(--mantine-primary-color-filled);
    }
  }
  
  @keyframes glitch {
    0% {
      transform: translate(0);
    }
    20% {
      transform: translate(-2px, 2px);
    }
    40% {
      transform: translate(-2px, -2px);
    }
    60% {
      transform: translate(2px, 2px);
    }
    80% {
      transform: translate(2px, -2px);
    }
    100% {
      transform: translate(0);
    }
  }
  
  /* Matrix theme styles */
  [data-theme="project89-matrix"] {
    --terminal-font: 'Share Tech Mono', 'Courier New', monospace;
    --header-font: 'Orbitron', sans-serif;
    --matrix-glow: 0 0 5px var(--mantine-color-neonGreen-5), 0 0 10px var(--mantine-color-neonGreen-5);
  }
  
  [data-theme="project89-matrix"] .mantine-Title-root,
  [data-theme="project89-matrix"] h1,
  [data-theme="project89-matrix"] h2,
  [data-theme="project89-matrix"] h3,
  [data-theme="project89-matrix"] h4 {
    font-family: var(--header-font);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    text-shadow: var(--matrix-glow);
    animation: textShadowPulse 2s infinite;
  }
  
  [data-theme="project89-matrix"] .mantine-Button-root {
    font-family: var(--header-font);
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid var(--mantine-color-neonGreen-5);
    box-shadow: var(--matrix-glow);
  }
  
  [data-theme="project89-matrix"] .mantine-Text-root {
    font-family: var(--terminal-font);
  }
  
  /* Tron theme styles */
  [data-theme="project89-tron"] {
    --terminal-font: 'VT323', 'Courier New', monospace;
    --header-font: 'Orbitron', sans-serif;
    --tron-glow: 0 0 5px var(--mantine-color-electricBlue-5), 0 0 10px var(--mantine-color-electricBlue-5);
  }
  
  [data-theme="project89-tron"] .mantine-Title-root,
  [data-theme="project89-tron"] h1,
  [data-theme="project89-tron"] h2,
  [data-theme="project89-tron"] h3,
  [data-theme="project89-tron"] h4 {
    font-family: var(--header-font);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    text-shadow: var(--tron-glow);
    animation: textShadowPulse 3s infinite;
  }
  
  [data-theme="project89-tron"] .mantine-Button-root {
    font-family: var(--header-font);
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid var(--mantine-color-electricBlue-5);
    box-shadow: var(--tron-glow);
    position: relative;
    overflow: hidden;
  }
  
  /* Button hover effect */
  [data-theme="project89-tron"] .mantine-Button-root:hover::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--mantine-color-electricBlue-5-rgb), 0.4),
      transparent
    );
    animation: scanline 1s linear;
  }
  
  [data-theme="project89-tron"] .mantine-Text-root {
    font-family: var(--terminal-font);
  }
  
  /* Common Project 89 terminal-style elements */
  [data-theme^="project89"] .mantine-Code-root,
  [data-theme^="project89"] code,
  [data-theme^="project89"] pre {
    font-family: var(--terminal-font);
    border: 1px solid var(--mantine-primary-color-filled);
    background-color: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 5px var(--mantine-primary-color-filled);
  }
  
  [data-theme^="project89"] .mantine-Card-root {
    backdrop-filter: blur(2px);
    border: 1px solid var(--mantine-primary-color-filled);
    box-shadow: 0 0 10px var(--mantine-primary-color-filled);
    overflow: hidden;
    position: relative;
  }
  
  /* Add scanline effect to cards */
  [data-theme^="project89"] .mantine-Card-root::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      transparent 0%, 
      rgba(32, 32, 32, 0.2) 50%, 
      transparent 100%
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 1;
  }
  
  /* Add moving scanline effect */
  [data-theme^="project89"] .mantine-Card-root::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--mantine-primary-color-filled),
      transparent
    );
    opacity: 0.3;
    pointer-events: none;
    z-index: 2;
    animation: scanline 8s linear infinite;
  }
  
  /* Text inputs get the terminal treatment */
  [data-theme^="project89"] .mantine-TextInput-input,
  [data-theme^="project89"] .mantine-Textarea-input,
  [data-theme^="project89"] .mantine-PasswordInput-input {
    font-family: var(--terminal-font);
    background-color: rgba(0, 0, 0, 0.6);
    border: 1px solid var(--mantine-primary-color-filled);
    box-shadow: 0 0 5px var(--mantine-primary-color-filled);
  }
  
  /* Navigation and tabs get the cyberpunk treatment */
  [data-theme^="project89"] .mantine-Tabs-tab {
    font-family: var(--header-font);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  [data-theme^="project89"] .mantine-NavLink-root {
    font-family: var(--terminal-font);
  }
  
  /* Loading indicators get a cyberpunk treatment */
  [data-theme^="project89"] .mantine-Loader-root {
    box-shadow: 0 0 15px var(--mantine-primary-color-filled);
  }
  
  /* Occasional glitch effect on hover */
  [data-theme^="project89"] .mantine-Title-root:hover,
  [data-theme^="project89"] h1:hover,
  [data-theme^="project89"] .mantine-Button-root:hover {
    animation: glitch 0.2s linear;
  }
  
  /* Headers get a special terminal-like effect */
  [data-theme^="project89"] .mantine-AppShell-header,
  [data-theme^="project89"] .mantine-Navbar-root {
    border: 1px solid var(--mantine-primary-color-filled);
    box-shadow: 0 0 10px var(--mantine-primary-color-filled);
    background-color: rgba(0, 0, 0, 0.85);
  }
`;

export default function App() {
  const { t } = useTranslation();
  useRedirectToCloudSelect();

  // Initialize MCP events handling (including navigation events)
  useMCPEvents();

  // Add Project 89 styles to the document
  useEffect(() => {
    // Add the style element if it doesn't exist
    if (!document.getElementById("project89-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "project89-styles";
      styleElement.textContent = project89CSS;
      document.head.appendChild(styleElement);
    }

    return () => {
      // Cleanup on unmount
      const styleElement = document.getElementById("project89-styles");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

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
          <Route
            path={"/s/:spaceId/projects"}
            element={<ProjectManagementPage />}
          />
          <Route
            path={"/spaces/:spaceId/projects"}
            element={<ProjectManagementPage />}
          />
          <Route path={"/spaces/:spaceId/tasks"} element={<TasksPage />} />
          <Route
            path={"/spaces/:spaceId/projects/:projectId/tasks"}
            element={<TasksPage />}
          />
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
