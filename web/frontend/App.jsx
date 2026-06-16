import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
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
                onClick: () => navigate("/retailers"), 
                selected: location.pathname === "/retailers",
              },
              {
                label: "Categories",
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

export default function App() {
  const pages = import.meta.glob(
    "./pages/**/!(*.test.[jt]sx)*.([jt]sx)",
    { eager: true }
  );

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <AppContent pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}