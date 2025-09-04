

import { useRef } from "react";
import { useDropzone } from "react-dropzone";
import { GiPaperClip } from "react-icons/gi";
import { IoSend } from "react-icons/io5";
import { ThreeDots } from "react-loader-spinner"; // import this at top
import PropTypes from "prop-types";
const ChatbotForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();

  // Handle text message submission

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    inputRef.current.value = "";

    const currentTime = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Add user message
    setChatHistory((history) => [
      ...history,
      {
        text: userMessage,
        role: "user",
        timestamp: currentTime,
      },
      {
        text: (
          <ThreeDots
            visible={true}
            height="16"
            width="23"
            color="#4fa94d"
            radius="9"
            ariaLabel="three-dots-loading"
          />
        ),
        role: "model",
        isLoading: true,
        timestamp: currentTime,
      },
    ]);

    // Trigger API response
    generateBotResponse([
      ...chatHistory,
      {
        role: "user",
        text: `Using the details provided above, please address this query: ${userMessage}`,
      },
    ]);
  };

  // Handle file uploads
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        setChatHistory((history) => [
          ...history,
          {
            text: file.name, // Show filename
            fileData: reader.result, // Base64 or Object URL
            fileType: file.type.startsWith("image") ? "image" : "file", // Identify type
            role: "user",
          },
        ]);
      };

      reader.readAsDataURL(file);
    });
  };

  const { getRootProps: getFileProps, getInputProps: getFileInputProps } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
      },
    });

  return (
    <div className="flex justify-evenly justify-items-center gap-1">
      <form method="post" onSubmit={handleFormSubmit}>
        <div className="flex gap-4">
          <div className="input-emoji-section relative flex max-h-[80px] w-[17rem] flex-[1_1] overflow-hidden rounded-sm border-[1px] border-[black] border-[solid] px-4 pb-1 pt-2 md:w-[16rem]">
            <div className="input-section text-sm">
              <input
                type="text"
                name="text"
                ref={inputRef}
                id="text"
                placeholder="Write a reply..."
                className="outline-none"
                required
              />
            </div>
            {/* <div className="emoji-section cursor-pointer">
              <input type="hidden" name="emoji" id="emoji" />
              <button type="button" className="btn btn-primary" id="emoji-btn">
                <BsEmojiSmile />
              </button>
            </div> */}
          </div>
          <div className="pdf&send_button-section flex items-center gap-3">
            <div className="pdf-section" {...getFileProps()}>
              <input
                type="file"
                name="pdf"
                id="pdf"
                hidden
                {...getFileInputProps()}
              />
              <button type="button" className="btn btn-primary" id="pdf-btn">
                <GiPaperClip />
              </button>
            </div>
            {/* <div className="setting">
              <button
                type="button"
                className="btn btn-primary"
                id="setting-btn"
              >
                <IoSettingsOutline />
              </button>
            </div> */}
            <div className="send-section">
              <button type="submit" className="btn btn-primary" id="send-btn">
                <IoSend />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

ChatbotForm.propTypes = {
  chatHistory: PropTypes.array.isRequired,
  setChatHistory: PropTypes.func.isRequired,
  generateBotResponse: PropTypes.func.isRequired,
};

export default ChatbotForm;
