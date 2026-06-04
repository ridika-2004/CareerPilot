import { useState } from "react";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import JobHunter from "../pages/JobHunter";
import Assistant from "../pages/Assistant";
import Tracker from "../pages/Tracker";
import Profile from "../pages/Profile";

const PAGES = { dashboard: Dashboard, jobs: JobHunter, assistant: Assistant, tracker: Tracker, profile: Profile };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const Page = PAGES[page];
  return (
    <Layout page={page} setPage={setPage}>
      <Page />
    </Layout>
  );
}