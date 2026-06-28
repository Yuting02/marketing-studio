import React, { useEffect, useRef, useState } from "react";
import { StickyNav } from "./components/marketing/StickyNav.jsx";
import { Hero } from "./components/marketing/Hero.jsx";
import { Workbench } from "./components/marketing/Workbench.jsx";
import { FeatureStats } from "./components/marketing/FeatureStats.jsx";
import { BottomCTA } from "./components/marketing/BottomCTA.jsx";

// 页面编排：滚动越过 hero 后让 StickyNav 滑入；Hero / BottomCTA 的按钮平滑滚到工作台。
function App() {
  const workbenchRef = useRef(null);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setNavVisible(window.scrollY > 520);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToWorkbench() {
    if (workbenchRef.current) {
      const y = workbenchRef.current.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <>
      <StickyNav visible={navVisible} />
      <Hero onTryClick={scrollToWorkbench} />
      <Workbench innerRef={workbenchRef} />
      <FeatureStats />
      <BottomCTA onStart={scrollToWorkbench} />
    </>
  );
}

export default App;
