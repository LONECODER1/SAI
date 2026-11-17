"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Stethoscope, User, Store as StoreIcon, MapPin, LocateFixed } from "lucide-react";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { setUserRole } from "@/actions/onboarding";
import { SPECIALTIES } from "@/lib/specialities";
import StorePinPicker from "@/components/map/store-pin-picker";

const doctorFormSchema = z.object({
  specialty: z.string().min(1, "Specialty is required"),
  experience: z
    .number()
    .min(1, "Experience must be at least 1 year")
    .max(70, "Experience must be less than 70 years"),
  credentialUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Credential URL is required"),
  description: z.string().min(1, "Description is required"),
});

const storeFormSchema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  licenseNumber: z.string().min(3, "Drug Retail License / GST is required"),
  licenseDocumentUrl: z.string().url("Please provide a valid document URL").optional().or(z.literal("")),
  storeAddress: z.string().min(5, "Complete physical address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().optional(),
  latitude: z.number({ required_error: "Latitude is required" }),
  longitude: z.number({ required_error: "Longitude is required" }),
});

const OnboardingPage = () => {
  const [step, setStep] = useState("choose-role");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const router = useRouter();

  const { data, loading, fn: submitUserRole } = useFetch(setUserRole);

  // Doctor Form
  const {
    register: registerDoctor,
    handleSubmit: handleSubmitDoctor,
    control: controlDoctor,
    formState: { errors: doctorErrors },
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  // Store Form
  const {
    register: registerStore,
    handleSubmit: handleSubmitStore,
    setValue: setStoreValue,
    watch: watchStore,
    formState: { errors: storeErrors },
  } = useForm({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: "",
      phone: "",
      licenseNumber: "",
      licenseDocumentUrl: "",
      storeAddress: "",
      city: "",
      postalCode: "",
      latitude: 28.6139,
      longitude: 77.2090,
    },
  });

  const currentLat = watchStore("latitude");
  const currentLng = watchStore("longitude");

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreValue("latitude", parseFloat(pos.coords.latitude.toFixed(6)));
        setStoreValue("longitude", parseFloat(pos.coords.longitude.toFixed(6)));
        setDetectingLocation(false);
        toast.success("Location coordinates detected successfully!");
      },
      (err) => {
        setDetectingLocation(false);
        toast.error("Failed to detect location: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  const handlePatientSelection = async () => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "PATIENT");
    await submitUserRole(formData);
  };

  const onDoctorSubmit = async (formDataValues) => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "DOCTOR");
    formData.append("specialty", formDataValues.specialty);
    formData.append("experience", formDataValues.experience.toString());
    formData.append("credentialUrl", formDataValues.credentialUrl);
    formData.append("description", formDataValues.description);
    await submitUserRole(formData);
  };

  const onStoreSubmit = async (formDataValues) => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "SELLER");
    formData.append("storeName", formDataValues.storeName);
    formData.append("phone", formDataValues.phone);
    formData.append("licenseNumber", formDataValues.licenseNumber);
    formData.append("licenseDocumentUrl", formDataValues.licenseDocumentUrl || "");
    formData.append("storeAddress", formDataValues.storeAddress);
    formData.append("city", formDataValues.city);
    formData.append("postalCode", formDataValues.postalCode || "");
    formData.append("latitude", formDataValues.latitude.toString());
    formData.append("longitude", formDataValues.longitude.toString());
    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data) {
      if (data.success) {
        toast.success("Role registration submitted!");
        router.push(data.redirect);
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [data, router]);

  // STEP 1: CHOOSE ROLE
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Card */}
        <Card
          onClick={() => !loading && handlePatientSelection()}
          className="border-teal-900/20 hover:border-teal-700/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-teal-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-teal-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book consultations with verified doctors, get e-prescriptions, and order medicines at lowest local prices.
            </CardDescription>
            <Button
              onClick={handlePatientSelection}
              disabled={loading}
              className="w-full mt-auto bg-teal-600 hover:bg-teal-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue as a Patient"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Doctor Card */}
        <Card
          onClick={() => !loading && setStep("doctor-form")}
          className="border-teal-900/20 hover:border-teal-700/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-teal-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              Conduct video appointments, set availability, issue digital prescriptions, and track credit earnings.
            </CardDescription>
            <Button
              disabled={loading}
              onClick={() => setStep("doctor-form")}
              className="w-full mt-auto bg-teal-600 hover:bg-teal-700"
            >
              Continue as a Doctor
            </Button>
          </CardContent>
        </Card>

        {/* Store / Dukaan Card */}
        <Card
          onClick={() => !loading && setStep("store-form")}
          className="border-teal-900/20 hover:border-teal-700/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-teal-900/20 rounded-full mb-4">
              <StoreIcon className="h-8 w-8 text-teal-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Pharmacy (Dukaan)
            </CardTitle>
            <CardDescription className="mb-4">
              List your medical store on the map, manage inventory, receive demand suggestions, and fulfill orders.
            </CardDescription>
            <Button
              disabled={loading}
              onClick={() => setStep("store-form")}
              className="w-full mt-auto bg-teal-600 hover:bg-teal-700"
            >
              Register Pharmacy Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 2A: DOCTOR FORM
  if (step === "doctor-form") {
    return (
      <Card className="border-teal-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription>
              Submit your credentials for verification. Once approved, you can accept patient consultations.
            </CardDescription>
          </div>

          <form onSubmit={handleSubmitDoctor(onDoctorSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Controller
                name="specialty"
                control={controlDoctor}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your medical specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {doctorErrors.specialty && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 8"
                {...registerDoctor("experience", { valueAsNumber: true })}
              />
              {doctorErrors.experience && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">Link to Medical License / Credential Document</Label>
              <Input
                id="credentialUrl"
                placeholder="https://example.com/medical-license.pdf"
                {...registerDoctor("credentialUrl")}
              />
              {doctorErrors.credentialUrl && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.credentialUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Professional Bio</Label>
              <Textarea
                id="description"
                placeholder="Brief summary of your clinical background..."
                {...registerDoctor("description")}
              />
              {doctorErrors.description && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.description.message}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // STEP 2B: STORE / DUKAAN FORM
  if (step === "store-form") {
    return (
      <Card className="border-teal-900/20 max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <StoreIcon className="h-6 w-6 text-teal-400" />
              Register Your Pharmacy Store (Dukaan)
            </CardTitle>
            <CardDescription>
              Enter your official pharmacy details. Once verified by Admin, patients nearby can find your inventory and order medicines.
            </CardDescription>
          </div>

          <form onSubmit={handleSubmitStore(onStoreSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Pharmacy / Store Name *</Label>
                <Input
                  id="storeName"
                  placeholder="e.g. Apollo Pharmacy / LifeCare Dukaan"
                  {...registerStore("storeName")}
                />
                {storeErrors.storeName && (
                  <p className="text-sm text-red-500">{storeErrors.storeName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone *</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +91 9876543210"
                  {...registerStore("phone")}
                />
                {storeErrors.phone && (
                  <p className="text-sm text-red-500">{storeErrors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Drug License Number / GSTIN *</Label>
                <Input
                  id="licenseNumber"
                  placeholder="e.g. DL-20B-129482"
                  {...registerStore("licenseNumber")}
                />
                {storeErrors.licenseNumber && (
                  <p className="text-sm text-red-500">{storeErrors.licenseNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseDocumentUrl">License Document Proof URL (PDF/Image)</Label>
                <Input
                  id="licenseDocumentUrl"
                  placeholder="https://example.com/drug-license.pdf"
                  {...registerStore("licenseDocumentUrl")}
                />
                {storeErrors.licenseDocumentUrl && (
                  <p className="text-sm text-red-500">{storeErrors.licenseDocumentUrl.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Complete Store Address *</Label>
              <Textarea
                id="storeAddress"
                placeholder="Shop No., Building, Street Name, Landmark..."
                {...registerStore("storeAddress")}
              />
              {storeErrors.storeAddress && (
                <p className="text-sm text-red-500">{storeErrors.storeAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="e.g. Mumbai, New Delhi" {...registerStore("city")} />
                {storeErrors.city && (
                  <p className="text-sm text-red-500">{storeErrors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal / PIN Code</Label>
                <Input id="postalCode" placeholder="e.g. 400001" {...registerStore("postalCode")} />
              </div>
            </div>

            {/* Geolocation Coordinates & Interactive Drag-and-Pin Map */}
            <div className="p-4 rounded-lg bg-teal-950/20 border border-teal-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-teal-300 font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Store GPS Location Coordinates & Storefront Pin
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                Drop a pin exactly on your pharmacy storefront door so patients in your radius receive accurate delivery routes and distance estimates.
              </p>

              {/* Interactive Pin Picker Component */}
              <StorePinPicker
                initialLat={currentLat}
                initialLng={currentLng}
                onCoordinatesChange={(pos) => {
                  setStoreValue("latitude", pos.latitude);
                  setStoreValue("longitude", pos.longitude);
                }}
              />

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...registerStore("latitude", { valueAsNumber: true })}
                  />
                  {storeErrors.latitude && (
                    <p className="text-xs text-red-500 mt-1">{storeErrors.latitude.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...registerStore("longitude", { valueAsNumber: true })}
                  />
                  {storeErrors.longitude && (
                    <p className="text-xs text-red-500 mt-1">{storeErrors.longitude.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Store...
                  </>
                ) : (
                  "Submit Store for Admin Approval"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
};

export default OnboardingPage;
