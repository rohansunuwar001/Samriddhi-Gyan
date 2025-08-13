import { useGetCoursesWithEnrolledStudentsQuery } from "@/features/api/adminDataApi";


const CourseStudent = () => {
  const { data, isLoading, isError } = useGetCoursesWithEnrolledStudentsQuery();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load courses and students.</div>;

  const courses = data?.courses || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Courses & Enrolled Students</h2>
      {courses.length === 0 ? (
        <div className="text-gray-500">No courses found.</div>
      ) : (
        courses.map((course) => (
          <div key={course.courseId} className="mb-10 border rounded-lg p-5 shadow bg-white">
            <div className="flex items-center gap-4 mb-2">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.courseTitle}
                  className="w-20 h-12 object-cover rounded"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{course.courseTitle}</h3>
                <div className="text-sm text-gray-600">
                  <span className="mr-4">Category: <span className="font-medium">{course.category}</span></span>
                  <span>Level: <span className="font-medium">{course.level}</span></span>
                </div>
                <div className="text-sm text-gray-600">
                  Enrolled Students: <span className="font-bold">{course.enrolledCount}</span>
                </div>
              </div>
            </div>
            <table className="min-w-full border mb-6 mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Photo</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {course.students && course.students.length > 0 ? (
                  course.students.map((student) => (
                    <tr key={student._id}>
                      <td className="border px-4 py-2">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">No Photo</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">{student.name}</td>
                      <td className="border px-4 py-2">{student.email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border px-4 py-2 text-center" colSpan={3}>
                      No students enrolled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default CourseStudent;
