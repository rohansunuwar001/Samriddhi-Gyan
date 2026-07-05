
const AllCareerButton = ({carrerp}) => {
  return (
    <div>
      <div className="main border rounded-lg">
        <a href="/career-paths" className="flex items-center justify-center  text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300">
          <span className="text-xl font-normal">{carrerp}</span>
        </a>
      </div>
    </div>
  )
}

export default AllCareerButton
