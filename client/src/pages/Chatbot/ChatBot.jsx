import { useEffect, useRef, useState } from "react";
import { FaCommentAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

import ChatbotIcon from "./ChatbotIcon";
import ChatMessage from "./ChatMessage";
import ChatbotForm from "./ChatbotForm";
import { companyInfo } from "./companyInfo";
import { useLoadUserQuery } from "@/features/api/authApi";


const useUserRole = () => {
  const { data: userData, isLoading, isError } = useLoadUserQuery();

 
  if (isLoading) {
    return null; 
  }

  if (isError || !userData?.user) {
    return 'guest';
  }


  return userData.user.role;
};

const ChatBot = () => {
  const userRole = useUserRole(); // Get the current user's role


  useEffect(() => {
    console.log("ChatBot component rendered. User Role:", userRole);
  }, [userRole]);

  const [chatHistory, setChatHistory] = useState([
    {
      hideInChat: true,
      role: "model",
      text: companyInfo,
    },
  ]);
  const [clickedOptions, setClickedOptions] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentTime, setCurrentTime] = useState(getNepalTime());
  const chatBodyRef = useRef();
  const [hasUnread, setHasUnread] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showChatbotIcon, setShowChatbotIcon] = useState(false);
  const originalTitle = useRef(null);
  const titleToggleInterval = useRef(null);

  useEffect(() => {
    originalTitle.current = document.title;
  }, []);

  const intro =
    " Welcome to Samriddhi Gyan! We’re here to help. Chat with a live expert or I can show you around.";

  const options = [
    "Learn More",
    "Curious about plan & pricing",
    "Ready to connect with an expert",
  ];

  useEffect(() => {
   
    if (userRole === null) {
      console.log("User role is still loading...");
      return;
    }

    if (userRole === "student") {
      console.log("User is student. Chatbot icon will appear in 3 seconds.");
      const iconTimer = setTimeout(() => {
        setShowChatbotIcon(true);
        setHasUnread(true);
        console.log("showChatbotIcon set to true.");
      }, 2000);

      return () => clearTimeout(iconTimer);
    } else {
      setShowChatbotIcon(false);
      setShowChatbot(false); // Ensure popup is also hidden for non-students
      console.log(`User role is '${userRole}'. Chatbot will not appear.`);
    }
  }, [userRole]);

  useEffect(() => {
    // This logic should only run if the chatbot icon is actually shown
    if (!showChatbotIcon) {
      clearInterval(titleToggleInterval.current); // Ensure interval is cleared if icon is hidden
      document.title = originalTitle.current || "Samriddhi Gyan"; // Reset title
      return;
    }

    const unreadMessages = chatHistory.filter(
      (msg) => msg.role === "model" && !msg.isRead
    ).length;

    if (showChatbot) {
      if (unreadMessages > 0) {
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.role === "model" ? { ...msg, isRead: true } : msg
          )
        );
        setHasUnread(false);
      }
      clearInterval(titleToggleInterval.current);
      document.title = originalTitle.current || "Samriddhi Gyan";
    } else {
      if (unreadMessages > 0 || hasUnread) {
        clearInterval(titleToggleInterval.current);
        titleToggleInterval.current = setInterval(() => {
          document.title =
            document.title === originalTitle.current
              ? `(${unreadMessages || 1}) New Message!`
              : originalTitle.current;
        }, 2000);
        setHasUnread(true);
      } else {
        clearInterval(titleToggleInterval.current);
        document.title = originalTitle.current || "Samriddhi Gyan";
        setHasUnread(false);
      }
    }

    return () => clearInterval(titleToggleInterval.current);
  }, [chatHistory, showChatbot, hasUnread, showChatbotIcon, originalTitle]); // Added originalTitle to dependencies

  const handleMessageClick = (index) => {
    setChatHistory((prev) => {
      const updatedHistory = [...prev];
      if (updatedHistory[index].role === "model") {
        updatedHistory[index].isRead = true;
      }
      return updatedHistory;
    });
  };

  const handleButtonClick = (message) => {
    setClickedOptions((prev) => [...prev, message]);
    const timestamp = getNepalTime();
    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: message, timestamp },
      { role: "model", isLoading: true, text: "", timestamp },
    ]);
    generateBotResponse([...chatHistory, { role: "user", text: message }]);
  };

  function getNepalTime() {
    const now = new Date();
    const options = {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(now);
  }

  useEffect(() => {
    setCurrentTime(getNepalTime());
  }, [chatHistory]);

  const handleFileUpload = (file, fileType) => {
    if (!file) return;
    setChatHistory((history) => [
      ...history,
      { text: "Uploading...", role: "user", isLoading: true, timestamp: getNepalTime() },
    ]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setChatHistory((history) => [
        ...history.filter((msg) => !msg.isLoading),
        {
          text: `📎 ${file.name} uploaded`,
          role: "user",
          fileType,
          fileData: reader.result,
          timestamp: getNepalTime(),
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const generateBotResponse = async (history) => {
    const updateHistory = (text, options = [], isError = false) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => !msg.isLoading),
        {
          role: "model",
          text,
          options,
          isError,
          isRead: false,
          timestamp: getNepalTime(),
        },
      ]);
      setHasUnread(true);
    };

    history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history }),
    };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=AIzaSyBA6SkGM3eewb2Dwen4GOHMltnYvngwybQ",
        requestOptions
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error.message || "Something went wrong!");

      const apiResponseText = data.candidates[0].content.parts[0].text.replace(
        /\*\*(.*?)\*\*/g,
        "$1"
      );
      const options = data.candidates[0].content.options || [];
      updateHistory(apiResponseText, options);
    } catch (error) {
      updateHistory(error.message, [], true);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (showChatbotIcon) {
      const messageTimer = setTimeout(() => {
        setShowMessage(true);
      }, 2500);
      const optionsTimer = setTimeout(() => {
        setShowOptions(true);
      }, 2500);
      return () => {
        clearTimeout(messageTimer);
        clearTimeout(optionsTimer);
      };
    }
  }, [showChatbotIcon]);

  return (
    <section className="fixed z-[9999] w-full bg-transparent">
      <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
        {showChatbotIcon && (
          <button
            onClick={() => {
              const newState = !showChatbot;
              setShowChatbot(newState);
              localStorage.setItem("chatbotOpened", newState);
              if (newState) {
                setHasUnread(false);
                document.title = originalTitle.current;
                setChatHistory((prev) =>
                  prev.map((msg) =>
                    msg.role === "model" ? { ...msg, isRead: true } : msg
                  )
                );
              }
            }}
            id="chatbot-toggler"
            className="fixed bottom-12 right-4 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-none bg-white transition-all duration-200 ease-in-out sm:right-[1.75rem]"
          >
            <span className="xl:h-17 xl:w-17 n9-attendent absolute h-full w-full justify-items-center rounded-[50%] bg-[url('/samriddhi_logo1.png')] bg-cover bg-center bg-no-repeat text-white"></span>
            {hasUnread && !showChatbot && (
              <span className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs text-white">
                {
                  chatHistory.filter(
                    (msg) => msg.role === "model" && !msg.isRead
                  ).length || 1
                }
              </span>
            )}
            <span className="absolute left-2 flex items-center justify-items-center text-white xl:h-[5rem] xl:w-[5rem]">
              {showChatbot ? (
                <IoClose className="h-14 w-16" />
              ) : (
                <FaCommentAlt className="h-6 w-6" />
              )}
            </span>
          </button>
        )}

        {showChatbot && showChatbotIcon && (
          <div className="chatbot-popup pointer-events-none fixed bottom-[2rem] right-[1rem] h-[33rem] w-[22rem] origin-bottom-right scale-[0.2] overflow-hidden rounded-[5px] bg-white opacity-0 shadow-[0_0_128px_0_rgba(0,0,0,0.1),0_32px_64px_0_rgba(0,0,0,0.5)] transition-all duration-100 ease-in sm:right-[1rem] lg:h-[35rem] lg:w-[23rem]">
            <div className="chat-header flex flex-shrink-0 items-center justify-between bg-[#25503E] px-[10px] py-[8px]">
              <div className="header-info flex items-center gap-[10px]">
                <div className="rounded-lg">
                <ChatbotIcon />
                </div>
                <h2 className="logo-text text-[0.8rem] font-semibold text-[#fff]">
                  Samriddhi Gyan
                </h2>
              </div>
              <button
                onClick={() => setShowChatbot((prev) => !prev)}
                className="material-symbols-outlined -mr-[10px] h-[35px] w-[35px] cursor-pointer rounded-[50%] border-none bg-none pt-[2px] text-[1.9rem] text-[#fff] outline-[none] [transition:0.2s_ease] hover:bg-[#25503E]"
              >
                <IoClose />
              </button>
            </div>
            <div
              ref={chatBodyRef}
              className="chat-body flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-17rem)] md:h-[26rem] lg:h-[28rem] 2xl:h-[28rem] flex-shrink flex-grow flex-col gap-[20px] overflow-hidden overflow-y-auto px-[10px] py-[9px] [scrollbar-width:thin] sm:px-[5px] sm:py-[6px] "
            >
              <div className="text-center font-Lexend text-[0.8rem] font-medium text-black">
                Today {currentTime}
              </div>
              {showMessage && (
                <div className="message bot-message flex items-center gap-[11px]">
                  <ChatbotIcon />
                  <div className="bot-container">
                    <div className="bot-header text-[10px] text-black">
                      Samriddhi Gyan
                    </div>
                    <p className="message-text font-lexend animate-slide-in max-w-[75%] transform whitespace-pre-line rounded-bl-[3px] rounded-br-[13px] rounded-tl-[13px] rounded-tr-[13px] bg-[#e1e5e8] px-[9px] py-[5px] text-left text-sm text-black [word-wrap:break-word] lg:text-[0.8rem]">
                      {intro}
                    </p>
                  </div>
                </div>
              )}
              {showOptions && (
                <div className="animate-slide-in mt-4 flex transform flex-col items-end space-y-2">
                  {options
                    .filter((option) => !clickedOptions.includes(option))
                    .map((option, index) => (
                      <button
                        key={index}
                        className="m-[2px] rounded-lg border-[1px] border-[#25503E] p-[8px] text-sm text-[#25503E] outline-[none] hover:bg-[#25503E] hover:text-[#fff]"
                        onClick={() => handleButtonClick(option)}
                      >
                        {option}
                      </button>
                    ))}
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} onClick={() => handleMessageClick(index)}>
                  <ChatMessage chat={chat} />
                </div>
              ))}
            </div>
            <div className="chat-footer absolute bottom-[0] w-full flex-shrink-0 bg-[#fff] px-[22px] pb-[9px] pt-[15px]">
              <ChatbotForm
                className="w-inherit"
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                generateBotResponse={generateBotResponse}
                handleFileUpload={handleFileUpload}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatBot;
 