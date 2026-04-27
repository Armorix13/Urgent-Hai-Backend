import { Outlet } from "react-router-dom";
import DocumentTitle from "@/components/DocumentTitle";

export default function RootLayout() {
  return (
    <div className="font-nunito-sans min-h-full">
      <DocumentTitle />
      <Outlet />
    </div>
  );
}
