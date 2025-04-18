import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/notifications/styles.css";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { mantineCssResolver, theme } from "@/theme";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "./i18n";

// Create a client with aggressive real-time settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ensure we always get fresh data
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // No stale time - always fetch fresh data
      staleTime: 0,
      // No automatic refetch interval (we'll handle this with WebSockets)
      refetchInterval: false,
      // Don't retry failed requests to avoid flickering
      retry: false,
      // In case of a background refetch error, don't revert to previous data
      retryOnMount: false,
      // Respond immediately to state changes
      notifyOnChangeProps: ["data", "error"],
    },
    mutations: {
      // Don't retry failed mutations
      retry: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter>
    <MantineProvider theme={theme} cssVariablesResolver={mantineCssResolver}>
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <Notifications position="bottom-center" limit={3} />
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  </BrowserRouter>
);
