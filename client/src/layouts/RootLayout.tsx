import { Outlet } from "react-router-dom";
import DocumentTitle from "@/components/DocumentTitle";

export default function RootLayout() {
  return (
    <>
      <DocumentTitle />
      <Outlet />
    </>
  );
}
