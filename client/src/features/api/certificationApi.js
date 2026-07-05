import { apiSlice } from "./apiSlice";

export const certificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Issuers (Parent categories) ──
    getIssuers: builder.query({
      query: () => "/certifications/issuers",
      providesTags: ["CertificationIssuer"],
    }),
    createIssuer: builder.mutation({
      query: (data) => ({
        url: "/certifications/issuers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CertificationIssuer"],
    }),
    updateIssuer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/certifications/issuers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CertificationIssuer"],
    }),
    deleteIssuer: builder.mutation({
      query: (id) => ({
        url: `/certifications/issuers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CertificationIssuer"],
    }),

    // ── Certifications (Child categories) ──
    getCertifications: builder.query({
      query: () => "/certifications",
      providesTags: ["Certification"],
    }),
    getCertificationBySlug: builder.query({
      query: (slug) => `/certifications/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Certification", id: slug }],
    }),
    createCertification: builder.mutation({
      query: (data) => ({
        url: "/certifications",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Certification"],
    }),
    updateCertification: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/certifications/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error) => [
        "Certification",
      ],
    }),
    deleteCertification: builder.mutation({
      query: (id) => ({
        url: `/certifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Certification"],
    }),

    // ── Exam Ticketing & Attempts ──
    getRegistrations: builder.query({
      query: () => "/certifications/registrations",
      providesTags: ["ExamRegistration"],
    }),
    registerMockExam: builder.mutation({
      query: (certId) => ({
        url: "/certifications/register-mock",
        method: "POST",
        body: { certId },
      }),
      invalidatesTags: ["ExamRegistration"],
    }),
    submitExam: builder.mutation({
      query: ({ regId, answers }) => ({
        url: `/certifications/submit/${regId}`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ["ExamRegistration", "CertReceived"],
    }),
    initializeExamEsewa: builder.mutation({
      query: (certId) => ({
        url: "/certifications/initialize-esewa",
        method: "POST",
        body: { certId },
      }),
      invalidatesTags: ["ExamRegistration"],
    }),
  }),
});

export const {
  useGetIssuersQuery,
  useCreateIssuerMutation,
  useUpdateIssuerMutation,
  useDeleteIssuerMutation,
  useGetCertificationsQuery,
  useGetCertificationBySlugQuery,
  useCreateCertificationMutation,
  useUpdateCertificationMutation,
  useDeleteCertificationMutation,
  useGetRegistrationsQuery,
  useRegisterMockExamMutation,
  useSubmitExamMutation,
  useInitializeExamEsewaMutation,
} = certificationApi;
