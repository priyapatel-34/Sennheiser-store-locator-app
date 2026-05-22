import {
  BrowserRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Frame, Navigation } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

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
                onClick: () =>
                  navigate({
                    pathname: "/retailers",
                    search: location.search,
                  }),
              },
              {
                label: "Categories",
                onClick: () =>
                  navigate({
                    pathname: "/categories",
                    search: location.search,
                  }),
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

export default function App() {
  const pages = import.meta.glob(
    "./pages/**/!(*.test.[jt]sx)*.([jt]sx)",
    { eager: true }
  );

  const config = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
    host: new URLSearchParams(window.location.search).get("host"),
    forceRedirect: true,
  };

  return (
    <PolarisProvider>
      <AppBridgeProvider config={config}>
        <BrowserRouter>
          <QueryProvider>
            <AppContent pages={pages} />
          </QueryProvider>
        </BrowserRouter>
      </AppBridgeProvider>
    </PolarisProvider>
  );
}