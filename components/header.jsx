import { checkUser } from "@/lib/checkUser";
import { checkAndAllocateCredits } from "@/actions/credits";
import HeaderClient from "@/components/header-client";
import React from "react";

export default async function Header() {
  let user = await checkUser();
  if (user?.role === "PATIENT") {
    const updatedUser = await checkAndAllocateCredits(user);
    if (updatedUser) user = updatedUser;
  }

  return <HeaderClient user={user} />;
}
