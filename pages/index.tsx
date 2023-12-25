import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(() => import("../views/App"), {
  ssr: false,
  loading: () => <p>...</p>,
});

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Base Script</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicComponentWithNoSSR></DynamicComponentWithNoSSR>
    </>
  );
};

export default Home;
