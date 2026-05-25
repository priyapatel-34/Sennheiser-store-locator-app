import { useMemo } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { Frame, Navigation } from "@shopify/polaris";
import Routes from "./Routes";
import { QueryProvider, PolarisProvider } from "./components";

function AppContent({ pages }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            items={[
              {
                label: "Retailers",
                url: "/retailers",
                onClick: () => navigate("/retailers"),
                selected: location.pathname === "/retailers",
              },
              {
                label: "Categories",
                url: "/categories",
                onClick: () => navigate("/categories"),
                selected: location.pathname === "/categories",
              },
            ]}
          />
        </Navigation>
      }
    >
      <Routes pages={pages} />
    </Frame>
  );
}

function AppBridgeWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const history = useMemo(
    () => ({ replace: (path) => navigate(path, { replace: true }) }),
    [navigate]
  );

  const router = useMemo(
    () => ({ location, history }),
    [location, history]
  );

  const config = {
    apiKey: process.env.SHOPIFY_API_KEY,
    host: new URLSearchParams(location.search).get("host"),
    forceRedirect: true,
  };

  return (
    <AppBridgeProvider config={config} router={router}>
      {children}
    </AppBridgeProvider>
  );
}

export default function App() {
  const pages = import.meta.glob(
    "./pages/**/!(*.test.[jt]sx)*.([jt]sx)",
    { eager: true }
  );

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeWrapper>
          <QueryProvider>
            <AppContent pages={pages} />
          </QueryProvider>
        </AppBridgeWrapper>
      </BrowserRouter>
    </PolarisProvider>
  );
}