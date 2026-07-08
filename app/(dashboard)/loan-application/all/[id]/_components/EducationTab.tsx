import { BookOpen, Building2, Calendar, GraduationCap } from "lucide-react";

import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function EducationTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Student Details" title="Education Background" />

      <InfoGrid>
        <InfoCard
          icon={GraduationCap}
          label="Highest Qualification"
          value={applicant.qualification}
        />
        <InfoCard
          icon={GraduationCap}
          label="Graduation Status"
          value={applicant.graduationStatus}
        />
        <InfoCard
          icon={BookOpen}
          label="Percentage / CGPA"
          value={applicant.percentage}
        />
        <InfoCard
          icon={Calendar}
          label="Year of Passing"
          value={applicant.yearOfPassing}
        />
        <InfoCard
          icon={Building2}
          label="Current Institution"
          value={applicant.currentInstitution}
        />
        <InfoCard
          icon={BookOpen}
          label="Work Experience"
          value={applicant.workExperience}
        />
        <InfoCard
          icon={GraduationCap}
          label="Study Destination"
          value={applicant.studyDestination}
        />
        <InfoCard icon={BookOpen} label="Country" value={applicant.country} />
        <InfoCard
          icon={Building2}
          label="University / College"
          value={applicant.university}
        />
        <InfoCard
          icon={BookOpen}
          label="Course Name"
          value={applicant.courseName}
        />
        <InfoCard
          icon={GraduationCap}
          label="Course Level"
          value={applicant.courseLevel}
        />
        <InfoCard
          icon={Calendar}
          label="Course Duration"
          value={applicant.courseDuration}
        />
        <InfoCard icon={Calendar} label="Intake" value={applicant.intake} />
        <InfoCard
          icon={BookOpen}
          label="Admission Status"
          value={applicant.admissionStatus}
        />
        <InfoCard
          icon={BookOpen}
          label="Offer Letter Received"
          value={applicant.offerLetterReceived}
        />
      </InfoGrid>
    </div>
  );
}