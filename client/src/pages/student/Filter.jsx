import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
const allCategories = [
  "HTML", "CSS", "JavaScript", "TypeScript",
  "Frontend Development", "Backend Development", "Fullstack Development",
  "MERN Stack Development", "Next JS", "React JS", "Vue JS", "Node JS",
  "Express JS", "MongoDB", "SQL", "Python", "Data Science", "Machine Learning",
  "Artificial Intelligence", "DevOps", "Docker", "Git & GitHub", "UI/UX Design",
  "Figma", "Adobe XD", "Photoshop", "Cybersecurity", "Cloud Computing", "AWS",
  "Firebase", "Java", "C++", "C#", "Android Development", "iOS Development",
  "Mobile App Development", "Software Testing", "System Design",
  "Operating Systems", "DSA (Data Structures & Algorithms)"
];

const Filter = ({ handleFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortByPrice, setSortByPrice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    return allCategories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prevCategories) => {
      const newCategories = prevCategories.includes(category)
        ? prevCategories.filter((id) => id !== category)
        : [...prevCategories, category];
      
      handleFilterChange(newCategories, sortByPrice);
      return newCategories;
    });
  };

  const selectByPriceHandler = (selectedValue) => {
    setSortByPrice(selectedValue);
    handleFilterChange(selectedCategories, selectedValue);
  };

  return (
    <div className="w-full md:w-[280px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg">Filter Options</h1>
        <Select onValueChange={selectByPriceHandler} value={sortByPrice}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by price</SelectLabel>
              <SelectItem value="low">Low to High</SelectItem>
              <SelectItem value="high">High to Low</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">CATEGORIES</h2>
          <span className="text-xs text-gray-500">
            {selectedCategories.length} selected
          </span>
        </div>

        <input
          type="text"
          placeholder="Search categories..."
          className="w-full p-2 mb-3 text-sm border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="max-h-[400px] overflow-y-auto pr-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2 my-2">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label
                  htmlFor={category}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No categories found</p>
          )}
        </div>
      </div>
    </div>
  );
};
Filter.propTypes = {
  handleFilterChange: PropTypes.func.isRequired,
};

export default React.memo(Filter);