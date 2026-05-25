import { BrowserRouter, useLocation } from "react-router-dom";
import { Frame, Navigation } from "@shopify/polaris";
import { AppProvider as ShopifyBridgeProvider } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import { QueryProvider, PolarisProvider } from "./components";

function AppContent({ pages }) {
  const location = useLocation();

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            items={[
              {
                label: "Retailers",
                url: "/retailers",
                selected: location.pathname === "/retailers",
              },
              {
                label: "Categories",
                url: "/categories",
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

  const apiKey = document
    .querySelector('meta[name="shopify-api-key"]')
    ?.content?.trim();

  const host = new URLSearchParams(location.search).get("host");

  return (
    <ShopifyBridgeProvider apiKey={apiKey} host={host}>
      <PolarisProvider>
        <BrowserRouter>
          <QueryProvider>
            <AppContent pages={pages} />
          </QueryProvider>
        </BrowserRouter>
      </PolarisProvider>
    </ShopifyBridgeProvider>
  );
}

// import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
// import { Frame, Navigation } from "@shopify/polaris";
// import Routes from "./Routes";
// import { QueryProvider, PolarisProvider } from "./components";

// function AppContent({ pages }) {
//   const location = useLocation();
//   const navigate = useNavigate();

//   return (
//     <Frame
//       navigation={
//         <Navigation location={location.pathname}>
//           <Navigation.Section
//             items={[
//               {
//                 label: "Retailers",
//                 onClick: () => navigate("/retailers"),  
//                 selected: location.pathname === "/retailers",
//               },
//               {
//                 label: "Categories",
//                 onClick: () => navigate("/categories"), 
//                 selected: location.pathname === "/categories",
//               },
//             ]}
//           />
//         </Navigation>
//       }
//     >
//       <Routes pages={pages} />
//     </Frame>
//   );
// }

// export default function App() {
//   const pages = import.meta.glob(
//     "./pages/**/!(*.test.[jt]sx)*.([jt]sx)",
//     { eager: true }
//   );

//   return (
//     <PolarisProvider>
//       <BrowserRouter>
//         <QueryProvider>
//           <AppContent pages={pages} />
//         </QueryProvider>
//       </BrowserRouter>
//     </PolarisProvider>
//   );
// }