"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import React from "react";

const SignInPage = () => {
  const { resolvedTheme } = useTheme();
  return <SignIn appearance={{ baseTheme: resolvedTheme === "dark" ? dark : undefined }} />;
};

export default SignInPage;
