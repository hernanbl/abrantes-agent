
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { router } from "./router";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <RouterProvider router={router} />
        </div>
        <Footer />
      </div>
      <Toaster />
      <SonnerToaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
