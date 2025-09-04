import ChatbotIcon from "./ChatbotIcon";
import { ThreeDots } from "react-loader-spinner";
import PropTypes from "prop-types";
const ChatMessage = ({ chat }) => {
  if (chat.hideInChat) return null;

  return (
    <div
      className={`message flex gap-2 sm:gap-3 md:gap-4 items-start ${
        chat.role === "model" ? "bot" : "user"
      }-message ${chat.isError ? "text-red-500" : ""}`}
    >
      {chat.role === "model" && <ChatbotIcon />}

      {/* Chat bubble container */}
      <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[75%]">
        {chat.isLoading ? (
          <div className="bg-[#e1e5e8] rounded-bl-sm rounded-br-xl rounded-tl-xl rounded-tr-xl px-3 py-2 inline-block">
            <ThreeDots
              visible={true}
              height="16"
              width="23"
              color="#4fa94d"
              radius="9"
              ariaLabel="three-dots-loading"
            />
          </div>
        ) : chat.fileType === "image" ? (
          <img
            src={chat.fileData}
            alt="Uploaded"
            className="w-full max-w-[300px] max-h-[300px] rounded-lg shadow-lg border object-contain"
          />
        ) : chat.fileType === "file" ? (
          <a
            href={chat.fileData}
            download={chat.text}
            className="bg-white text-gray-700 text-sm px-3 py-2 rounded-md shadow-sm inline-block break-words max-w-full"
          >
            📎 {chat.text}
          </a>
        ) : (
          <p className="message-text break-words whitespace-pre-line text-xs px-3 py-2 bg-[#e1e5e8] rounded-bl-sm rounded-br-xl rounded-tl-xl rounded-tr-xl">
            {typeof chat.text === "string" ? chat.text : chat.text}
          </p>
        )}
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  chat: PropTypes.object.isRequired,
};

export default ChatMessage;
