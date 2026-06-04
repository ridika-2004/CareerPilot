import { useState } from "react";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import JobHunter from "../pages/JobHunter";
import Assistant from "../pages/Assistant";
import Tracker from "../pages/Tracker";
import Profile from "../pages/Profile";

const PAGES = { home: Home, dashboard: Dashboard, jobs: JobHunter, assistant: Assistant, tracker: Tracker, profile: Profile };

export default function App() {
  const [page, setPage] = useState("home");
  const Page = PAGES[page];
  return (
    <Layout page={page} setPage={setPage}>
      <Page setPage={setPage} />
    </Layout>
  );
}
