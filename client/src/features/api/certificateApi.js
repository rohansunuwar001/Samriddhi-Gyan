import { apiSlice } from "./apiSlice";

export const certificateApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Instructor CRUD ──────────────────────────────────────────────────────
    createCertificate: builder.mutation({
      query: (formData) => ({
        url: "/certificate",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Certificate"],
    }),

    getMyCertificates: builder.query({
      query: () => "/certificate/my",
      providesTags: ["Certificate"],
    }),

    getCertificateById: builder.query({
      query: (id) => `/certificate/${id}`,
      providesTags: (_, __, id) => [{ type: "Certificate", id }],
    }),

    updateCertificate: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/certificate/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (_, __, { id }) => ["Certificate", { type: "Certificate", id }],
    }),

    deleteCertificate: builder.mutation({
      query: (id) => ({
        url: `/certificate/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Certificate"],
    }),

    // ── Issue ────────────────────────────────────────────────────────────────
    getCourseStudents: builder.query({
      query: (id) => `/certificate/${id}/students`,
      providesTags: (_, __, id) => [{ type: "CertStudents", id }],
    }),

    getIssuedForTemplate: builder.query({
      query: (id) => `/certificate/${id}/issued`,
      providesTags: (_, __, id) => [{ type: "CertIssued", id }],
    }),

    issueCertificates: builder.mutation({
      query: ({ id, studentIds }) => ({
        url: `/certificate/${id}/issue`,
        method: "POST",
        body: { studentIds },
      }),
      invalidatesTags: (_, __, { id }) => [
        "Certificate",
        { type: "CertIssued", id },
        { type: "CertStudents", id },
      ],
    }),

    // ── Student view ─────────────────────────────────────────────────────────
    getMyReceivedCertificates: builder.query({
      query: () => "/certificate/received",
      providesTags: ["CertReceived"],
    }),

    // ── Public verify ────────────────────────────────────────────────────────
    verifyCertificate: builder.query({
      query: (certId) => `/certificate/verify/${certId}`,
    }),
  }),
});

export const {
  useCreateCertificateMutation,
  useGetMyCertificatesQuery,
  useGetCertificateByIdQuery,
  useUpdateCertificateMutation,
  useDeleteCertificateMutation,
  useGetCourseStudentsQuery,
  useGetIssuedForTemplateQuery,
  useIssueCertificatesMutation,
  useGetMyReceivedCertificatesQuery,
  useVerifyCertificateQuery,
} = certificateApi;
