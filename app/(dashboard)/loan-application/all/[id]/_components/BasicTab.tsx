// app\(dashboard)\loan-application\all\[id]\_components\BasicTab.tsx
import {
  Calendar,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateLoanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import { useUpdateLoanApplication } from "@/hooks/loan-application/useLoanApplications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatDate } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function BasicTab({ applicant }: { applicant: LoanApplication }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateLoanApplication(applicant.id);

  const { register, handleSubmit, reset } = useForm<any>({
    resolver: zodResolver(updateLoanApplicationSchema),
    defaultValues: {
      fullName: applicant.fullName || "",
      mobile: applicant.mobile || "",
      altMobile: applicant.altMobile || "",
      email: applicant.email || "",
      currentAddress: applicant.currentAddress || "",
      permanentAddress: applicant.permanentAddress || "",
      city: applicant.city || "",
      state: applicant.state || "",
      pin: applicant.pin || "",
    },
  });

  const onSubmit = async (values: any) => {
    await update.mutateAsync(values);
    setEditing(false);
    reset(values);
  };
  return (
    <div className="space-y-6">
      <TabHeader
        eyebrow="Applicant Profile"
        title="Basic Information"
        action={
          editing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )
        }
      />

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-black">Full Name</label>
              <Input {...register("fullName")} />
            </div>
            <div>
              <label className="text-xs font-black">Mobile</label>
              <Input {...register("mobile")} />
            </div>
            <div>
              <label className="text-xs font-black">Alt Mobile</label>
              <Input {...register("altMobile")} />
            </div>
            <div>
              <label className="text-xs font-black">Email</label>
              <Input {...register("email")} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-black">Current Address</label>
              <Input {...register("currentAddress")} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-black">Permanent Address</label>
              <Input {...register("permanentAddress")} />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      ) : (
        <InfoGrid>
          <InfoCard icon={User} label="Full Name" value={applicant.fullName} />
          <InfoCard
            icon={Phone}
            label="Mobile Number"
            value={applicant.mobile}
          />
          <InfoCard
            icon={Phone}
            label="Alternate Mobile"
            value={applicant.altMobile}
          />
          <InfoCard icon={Mail} label="Email" value={applicant.email} />
          <InfoCard
            icon={Calendar}
            label="Date of Birth"
            value={formatDate(applicant.dob)}
          />
          <InfoCard icon={Users} label="Gender" value={applicant.gender} />
          <InfoCard
            icon={Users}
            label="Marital Status"
            value={applicant.maritalStatus}
          />
          <InfoCard icon={FileText} label="Aadhaar" value={applicant.aadhaar} />
          <InfoCard icon={FileText} label="PAN" value={applicant.pan} />
          <InfoCard
            icon={FileText}
            label="Passport"
            value={applicant.passport}
          />
          <InfoCard
            icon={Calendar}
            label="Passport Expiry"
            value={formatDate(applicant.passportExpireDate)}
          />
          <InfoCard
            icon={Calendar}
            label="Application Date"
            value={formatDate(applicant.enquiryDate)}
          />
          <InfoCard icon={MapPin} label="City" value={applicant.city} />
          <InfoCard icon={MapPin} label="State" value={applicant.state} />
          <InfoCard icon={MapPin} label="PIN Code" value={applicant.pin} />
          <InfoCard
            icon={MapPin}
            label="Branch"
            value={applicant.branchName || applicant.branch}
          />
          <InfoCard
            icon={User}
            label="Counsellor"
            value={
              applicant.counselorName ||
              applicant.counselor ||
              applicant.counsellor
            }
          />
          <InfoCard
            icon={User}
            label="Fintech Assignee"
            value={applicant.fintechAssigneeName || applicant.fintechAssignee}
          />
          <InfoCard
            icon={FileText}
            label="Lead Source"
            value={applicant.leadSource}
          />
          <InfoCard
            icon={FileText}
            label="Priority"
            value={applicant.priority}
          />
        </InfoGrid>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AddressCard title="Current Address" value={applicant.currentAddress} />
        <AddressCard
          title="Permanent Address"
          value={applicant.permanentAddress}
        />
      </div>

      <AddressCard title="Remarks" value={applicant.remarks} />
    </div>
  );
}

function AddressCard({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value || "Not provided"}
      </p>
    </div>
  );
}
