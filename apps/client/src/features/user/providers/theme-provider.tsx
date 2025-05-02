import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  MantineProvider,
  MantineColorScheme,
  useMantineColorScheme,
  MantineThemeOverride,
  useMantineTheme,
} from "@mantine/core";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/current-user-atom";
import {
  getThemeById,
  DocmostTheme,
  mantineCssResolver,
  theme as baseTheme,
} from "@/theme";
import { setManualThemeApplied } from "../hooks/use-current-user";

// For debugging
const DEBUG_THEME = true;

// Global flag to prevent multiple theme applications
let themeBeingApplied = false;

interface ThemeContextType {
  activeTheme: DocmostTheme;
  setThemeById: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: getThemeById("default-light"),
  setThemeById: () => {},
});

export const useDocmostTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function DocmostThemeProvider({ children }: ThemeProviderProps) {
  const [user] = useAtom(userAtom);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();
  const themeInitializedRef = useRef(false);

  // Use state for active theme to ensure it updates properly
  const [activeTheme, setActiveTheme] = useState<DocmostTheme>(() => {
    const defaultTheme =
      colorScheme === "dark" ? "default-dark" : "default-light";
    const themeId = user?.settings?.preferences?.themeId || defaultTheme;

    if (DEBUG_THEME) {
      console.log("[THEME-PROVIDER] Initializing with theme:", themeId);
    }

    return getThemeById(themeId);
  });

  // Construct theme override based on current active theme
  const themeOverride = useMemo<MantineThemeOverride>(() => {
    return {
      ...mantineTheme,
      primaryColor: activeTheme.primaryColor,
      colors: mantineTheme.colors,
    };
  }, [activeTheme, mantineTheme]);

  // Function to apply a theme to all parts of the system
  const applyThemeToSystem = (theme: DocmostTheme) => {
    if (themeBeingApplied) {
      console.log(
        "[THEME-PROVIDER] Theme application already in progress, skipping"
      );
      return;
    }

    try {
      themeBeingApplied = true;

      if (DEBUG_THEME) {
        console.log("[THEME-PROVIDER] Applying theme to system:", {
          themeId: theme.id,
          primaryColor: theme.primaryColor,
          isDark: theme.isDark,
        });
      }

      // Set color scheme
      setColorScheme(theme.isDark ? "dark" : "light");

      // Apply CSS custom properties
      document.documentElement.setAttribute("data-theme", theme.id);
      document.documentElement.setAttribute(
        "data-theme-primary",
        theme.primaryColor
      );
      document.documentElement.setAttribute(
        "data-theme-secondary",
        theme.secondaryColor || "red"
      );

      // Apply font family if specified
      if (theme.headingFontFamily) {
        document.documentElement.style.setProperty(
          "--mantine-heading-font-family",
          theme.headingFontFamily
        );

        // Load Orbitron font if it's specified (for Project 89 themes)
        if (
          theme.headingFontFamily.includes("Orbitron") &&
          !document.getElementById("orbitron-font")
        ) {
          const link = document.createElement("link");
          link.id = "orbitron-font";
          link.rel = "stylesheet";
          link.href =
            "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap";
          document.head.appendChild(link);

          if (DEBUG_THEME) {
            console.log(
              "[THEME-PROVIDER] Loaded Orbitron font for Project 89 theme"
            );
          }
        }
      } else {
        // Reset to default heading font
        document.documentElement.style.removeProperty(
          "--mantine-heading-font-family"
        );

        // Optionally remove font if no longer needed
        const orbitronLink = document.getElementById("orbitron-font");
        if (orbitronLink && !theme.id.includes("project89")) {
          orbitronLink.remove();
        }
      }

      // Apply global CSS custom properties for theme colors
      document.documentElement.style.setProperty(
        "--theme-primary-color",
        theme.primaryColor
      );
      document.documentElement.style.setProperty(
        "--theme-primary-dark",
        `var(--mantine-color-${theme.primaryColor}-7)`
      );
      document.documentElement.style.setProperty(
        "--theme-primary-light",
        `var(--mantine-color-${theme.primaryColor}-2)`
      );

      // Important: update state last to ensure UI updates
      setActiveTheme(theme);
    } finally {
      setTimeout(() => {
        themeBeingApplied = false;

        if (DEBUG_THEME) {
          console.log(
            "[THEME-PROVIDER] Theme application completed for:",
            theme.id
          );
        }
      }, 50); // Small delay to prevent rapid consecutive changes
    }
  };

  // This effect only runs once on mount to set the initial theme
  useEffect(() => {
    if (themeInitializedRef.current) return;

    if (DEBUG_THEME) {
      console.log("[THEME-PROVIDER] Initial theme setup");
    }

    themeInitializedRef.current = true;

    // Apply the initial theme
    if (user?.settings?.preferences?.themeId) {
      const themeId = user.settings.preferences.themeId;
      const userTheme = getThemeById(themeId);

      if (DEBUG_THEME) {
        console.log(
          "[THEME-PROVIDER] Setting initial theme from user preferences:",
          {
            themeId,
            resolvedTheme: userTheme,
          }
        );
      }

      applyThemeToSystem(userTheme);
    }
  }, []); // This effect should only run once

  // This effect handles user preference changes
  useEffect(() => {
    // Skip if no user or the initial theme setup hasn't happened yet
    if (!user || !themeInitializedRef.current) return;

    const userThemeId = user.settings?.preferences?.themeId;

    // We only want to respond to user preference changes if:
    // 1. A manual theme hasn't been applied (i.e., user didn't explicitly select a theme)
    // 2. The theme ID from user preferences exists and is different from the current active theme
    if (userThemeId && userThemeId !== activeTheme.id) {
      if (DEBUG_THEME) {
        console.log("[THEME-PROVIDER] User preferences theme changed:", {
          newThemeId: userThemeId,
          currentThemeId: activeTheme.id,
        });
      }

      // Only apply the theme from user preferences if a theme wasn't manually selected
      const userTheme = getThemeById(userThemeId);
      applyThemeToSystem(userTheme);
    }
  }, [user?.settings?.preferences?.themeId, activeTheme.id]);

  // This function is used by other components to change the theme
  const setThemeById = (themeId: string) => {
    if (themeId === activeTheme.id) {
      if (DEBUG_THEME) {
        console.log(
          "[THEME-PROVIDER] Skipping theme change - already using this theme:",
          themeId
        );
      }
      return;
    }

    const newTheme = getThemeById(themeId);

    if (DEBUG_THEME) {
      console.log("[THEME-PROVIDER] Setting theme manually:", {
        themeId,
        resolvedTheme: newTheme,
      });
    }

    // Mark as manually applied to prevent override
    setManualThemeApplied(true);

    // Apply theme to entire system
    applyThemeToSystem(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setThemeById }}>
      <MantineProvider theme={themeOverride}>{children}</MantineProvider>
    </ThemeContext.Provider>
  );
}

// Utility hook for other components to access theme colors
export function useThemeColors() {
  const { activeTheme } = useDocmostTheme();
  const { colorScheme } = useMantineColorScheme();

  return {
    primaryColor: activeTheme.primaryColor,
    secondaryColor: activeTheme.secondaryColor || "red",
    isDark: colorScheme === "dark",
  };
}
