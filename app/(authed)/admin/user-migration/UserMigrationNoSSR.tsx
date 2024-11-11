"use client";

import dynamic from "next/dynamic";

const UserMigration = dynamic(() => import("./UserMigration"), { ssr: false });
export const UserMigrationNoSSR = () => {
	return <UserMigration />;
};
