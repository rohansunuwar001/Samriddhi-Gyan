import React, { forwardRef } from "react";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const CertificatePreview = forwardRef(({ data = {} }, ref) => {
  const {
    organizationName = "Samriddhi Gyan",
    organizationLogo,
    certificateTitle = "Certificate of Completion",
    certificateStatement = "This is to certify that the above-named individual has successfully completed the course.",
    recipientName = "Recipient Name",
    courseName = "Course Name",
    completionDate,
    issueDate,
    certificateId,
    verificationUrl,
    duration,
    grade,
    instructorName,
    accreditation,
    authorizedSignature,
    officialSeal,
  } = data;

  const fmtDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const verifyLink = certificateId
    ? `${window.location.origin}/verify/${certificateId}`
    : verificationUrl || "";

  return (
    <div
      ref={ref}
      id="certificate-print-area"
      style={{ fontFamily: "'Playfair Display', serif" }}
      className="
        relative w-[794px] min-h-[562px] bg-white
        flex flex-col items-center justify-between
        p-10 overflow-hidden select-none
        shadow-2xl print:shadow-none
      "
    >
      {/* ── Outer decorative border ─── */}
      <div className="absolute inset-2 border-4 border-amber-600 rounded pointer-events-none" />
      <div className="absolute inset-4 border border-amber-400 rounded pointer-events-none" />

      {/* ── Background watermark ─── */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <Award size={340} className="text-amber-700" />
      </div>

      {/* ── Gradient header band ─── */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700 rounded-t" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700 rounded-b" />

      {/* ── Content ─── */}
      <div className="relative z-10 flex flex-col items-center w-full gap-4">

        {/* Header row: logo + org name */}
        <div className="flex flex-col items-center gap-2">
          {organizationLogo ? (
            <img src={organizationLogo} alt="org logo" className="h-14 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <Award className="text-amber-600" size={36} />
            </div>
          )}
          <p className="text-base tracking-[0.25em] uppercase text-amber-700 font-sans font-medium">
            {organizationName}
          </p>
        </div>

        {/* Certificate title */}
        <div className="text-center">
          <h1
            className="text-5xl font-semibold text-gray-800 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.02em" }}
          >
            {certificateTitle}
          </h1>
          <div className="mt-1 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-amber-500" />
            <Award size={16} className="text-amber-500" />
            <div className="h-px w-16 bg-amber-500" />
          </div>
        </div>

        {/* Presented to */}
        <div className="text-center">
          <p className="text-base tracking-widest uppercase font-sans text-gray-500 mb-1">
            Presented to
          </p>
          <h2
            className="text-4xl text-amber-800 font-semibold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {recipientName}
          </h2>
        </div>

        {/* Statement */}
        <p className="text-center text-gray-600 text-base leading-relaxed max-w-xl font-sans italic px-4">
          {certificateStatement}
        </p>

        {/* Course name */}
        <div className="bg-amber-50 border border-amber-200 rounded px-8 py-2 text-center">
          <p className="text-sm uppercase tracking-widest text-amber-700 font-sans font-medium mb-0.5">
            Course / Program
          </p>
          <p className="text-xl text-gray-800 font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
            {courseName}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-start justify-center gap-8 w-full">
          {completionDate && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-400 font-sans">Completed</p>
              <p className="text-base font-medium text-gray-700 font-sans">{fmtDate(completionDate)}</p>
            </div>
          )}
          {duration && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-400 font-sans">Duration</p>
              <p className="text-base font-medium text-gray-700 font-sans">{duration}</p>
            </div>
          )}
          {grade && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-400 font-sans">Grade</p>
              <p className="text-base font-medium text-gray-700 font-sans">{grade}</p>
            </div>
          )}
          {issueDate && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-400 font-sans">Issued</p>
              <p className="text-base font-medium text-gray-700 font-sans">{fmtDate(issueDate)}</p>
            </div>
          )}
        </div>

        {/* Footer: signature | seal | QR */}
        <div className="flex items-end justify-between w-full mt-2 px-4">
          {/* Signature */}
          <div className="flex flex-col items-center gap-1 min-w-[140px]">
            {authorizedSignature ? (
              <img src={authorizedSignature} alt="signature" className="h-12 object-contain" />
            ) : (
              <div className="h-12 w-32 border-b border-gray-400" />
            )}
            <p className="text-sm text-gray-500 font-sans text-center">
              {instructorName || "Authorized Signatory"}
            </p>
            <p className="text-[10px] text-gray-400 font-sans">Instructor / Director</p>
          </div>

          {/* Official seal */}
          {officialSeal && (
            <img src={officialSeal} alt="seal" className="h-16 w-16 object-contain opacity-80" />
          )}

          {/* QR + cert ID */}
          <div className="flex flex-col items-center gap-1">
            {verifyLink ? (
              <QRCodeSVG value={verifyLink} size={52} level="M" />
            ) : (
              <div className="h-[52px] w-[52px] bg-gray-100 border rounded flex items-center justify-center text-gray-300 text-sm">
                QR
              </div>
            )}
            {certificateId && (
              <p className="text-[9px] text-gray-400 font-mono">{certificateId}</p>
            )}
            <p className="text-[9px] text-gray-400 font-sans">Scan to verify</p>
          </div>
        </div>

        {/* Accreditation */}
        {accreditation && (
          <p className="text-center text-[10px] text-gray-400 font-sans mt-1 italic">
            {accreditation}
          </p>
        )}
      </div>
    </div>
  );
});

CertificatePreview.displayName = "CertificatePreview";
export default CertificatePreview;
