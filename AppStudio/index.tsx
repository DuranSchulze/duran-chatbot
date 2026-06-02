/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { GoogleGenAI, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a legal AI assistant for Duran & Duran-Schulze Law, a highly respected Philippine law firm. Your purpose is to provide general information about legal processes in a formal and professional tone. Structure your responses into clear paragraphs for readability.

Your specializations are:
- Family Law (annulment, custody, support, marital issues)
- Immigration Law (visas, deportation, dual citizenship, permanent residency)
- Property and Estate Law (land ownership, inheritance, title transfer, estate settlement)
- Tax Law (estate tax amnesty, BIR registration, income and estate tax compliance)
- Corporate Law (business registration, SEC compliance, shareholder rights, corporate governance)
- Intellectual Property Law (trademark, copyright, patent, IP registration through IPO Philippines)
- Labor Law (employment, wages, unfair labor practice, etc.)

Your role is to provide a general process related to a legal inquiry, but making sure that it is accurate and align with the Philippine laws and rules. Explain the steps involved and what can generally be expected.

Crucially, you MUST NOT provide specific legal advice. Even if you are an AI, your knowledge should be completely accurate or up-to-date, and align with the Supreme Court of the Philippines rules and decisions. If asked for detailed guidance tailored to a particular case, a legal opinion, or any form of specific advice, you MUST politely decline and strongly recommend scheduling a consultation with the human attorneys at Duran & Duran-Schulze Law.

If a user asks about our office location, address, or how to find us, you must respond by stating that our office details can be found on our official website.

This is an example of how to respond when asked for specific advice: 'For a more comprehensive understanding and personalized advice tailored to your situation, we strongly recommend scheduling a consultation with one of our experienced attorneys at Duran & Duran-Schulze Law. As an AI assistant, I cannot provide formal legal advice.'

IMPORTANT: Always conclude every response with the firm's official website: https://duranschulze.com/.`;

type Message = {
  text: string;
  sender: "user" | "ai" | "error";
  timestamp: Date;
};

type QuoteFormData = {
  name: string;
  email: string;
  contact: string;
  summary: string;
};

const INITIAL_MESSAGE_TEXT =
  "Thank you for reaching out to Duran & Duran-Schulze Law.\n\nResponses in this chat box are AI-generated and for informational purposes only. They do not constitute legal advice. We strongly recommend consulting and verifying the information with one of our qualified lawyers for formal legal guidance.\n\nTo begin, please provide your name and email below.";

const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/\S+|www\.\S+)/g;
  // Filter out empty lines to prevent creating empty <p> tags from double newlines
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line, lineIndex) => (
      <p key={lineIndex}>
        {line.split(urlRegex).map((part, partIndex) => {
          if (part.match(urlRegex)) {
            const href = part.startsWith("www.") ? `https://www.${part}` : part;
            return (
              <a
                key={partIndex}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part}
              </a>
            );
          }
          return <span key={partIndex}>{part}</span>;
        })}
      </p>
    ));
};

const formatMessagesForEmail = (messages: Message[]): string => {
  return messages
    .map((msg) => {
      const sender = msg.sender === "user" ? "Client" : "Legal AI Assistant";
      let text = msg.text;
      if (
        sender === "Legal AI Assistant" &&
        !text.includes("https://duranschulze.com/")
      ) {
        const lastPara = text.lastIndexOf("\n\n");
        if (lastPara !== -1) {
          text = text.substring(0, lastPara); // remove boilerplate for brevity
        }
      }
      return `${sender}:\n${text}\n\n`;
    })
    .join("");
};

const IdentificationForm = ({
  onSubmit,
}: {
  onSubmit: (data: { name: string; email: string }) => void;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onSubmit({ name, email });
    }
  };

  return (
    <form
      className="identification-form"
      onSubmit={handleSubmit}
      aria-labelledby="identification-form-heading"
    >
      <h2 id="identification-form-heading" className="visually-hidden">
        User Identification
      </h2>
      <input
        ref={nameInputRef}
        type="text"
        placeholder="Complete Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-label="Complete Name"
      />
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email Address"
      />
      <button type="submit" className="start-chat-btn">
        Start Chat
      </button>
    </form>
  );
};

const QuoteForm = ({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
  initialData: { name: string; email: string };
}) => {
  const [name, setName] = useState(initialData.name || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [contact, setContact] = useState("");
  const [summary, setSummary] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, contact, summary });
  };

  return (
    <form
      className="quote-form"
      onSubmit={handleSubmit}
      aria-labelledby="quote-form-heading"
    >
      <h3 id="quote-form-heading">Service Quote Request</h3>
      <p>Please provide your details below to receive a quote.</p>
      <input
        ref={nameInputRef}
        type="text"
        placeholder="Complete Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-label="Complete Name"
      />
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email Address"
      />
      <input
        type="tel"
        placeholder="Contact Number"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        required
        aria-label="Contact Number"
      />
      <textarea
        placeholder="Concise summary of legal concerns..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        required
        aria-label="Summary of legal concerns"
      ></textarea>
      <div className="quote-form-actions">
        <button type="submit" className="submit-quote-btn">
          Submit Request
        </button>
        <button type="button" onClick={onCancel} className="cancel-quote-btn">
          Cancel
        </button>
      </div>
    </form>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: INITIAL_MESSAGE_TEXT, sender: "ai", timestamp: new Date() },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null,
  );
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const [userIdentified, setUserIdentified] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const initChat = () => {
    try {
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY!,
      });
      chatRef.current = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
    } catch (e) {
      console.error("Failed to initialize AI Chat:", e);
      setMessages((prev) => [
        ...prev,
        {
          text: "Error: Could not initialize the Legal AI Assistant. Please check the configuration.",
          sender: "error",
          timestamp: new Date(),
        },
      ]);
    }
  };

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    const el = chatWindowRef.current;
    if (el) {
      const isScrolledNearBottom =
        el.scrollHeight - el.scrollTop <= el.clientHeight + 150;
      if (isScrolledNearBottom) {
        el.scrollTop = el.scrollHeight;
        if (showScrollToBottom) setShowScrollToBottom(false);
      } else {
        if (
          messages.length > 0 &&
          messages[messages.length - 1].sender !== "user"
        ) {
          setShowScrollToBottom(true);
        }
      }
    }
  }, [messages, showScrollToBottom]);

  const handleIdentificationSubmit = ({
    name,
    email,
  }: {
    name: string;
    email: string;
  }) => {
    setUserName(name);
    setUserEmail(email);
    setUserIdentified(true);
    setMessages((prev) => [
      ...prev,
      {
        text: `Thank you, ${name}. How may I assist you today?`,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  // --- Chat Functions ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      text: userInput,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setUserInput("");
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        throw new Error("Chat is not initialized.");
      }

      const stream = await chatRef.current.sendMessageStream({
        message: userInput,
      });

      let aiResponseText = "";
      setMessages((prev) => [
        ...prev,
        { text: "", sender: "ai", timestamp: new Date() },
      ]);

      for await (const chunk of stream) {
        aiResponseText += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = aiResponseText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        text: "We apologize, but an unexpected error occurred. Please try your request again shortly.",
        sender: "error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewInquiry = () => {
    if (
      window.confirm(
        "Are you sure you want to start a new inquiry? Your current chat history will be lost.",
      )
    ) {
      setMessages([
        { text: INITIAL_MESSAGE_TEXT, sender: "ai", timestamp: new Date() },
      ]);
      setShowQuoteForm(false);
      setIsLoading(false);
      setUserIdentified(false);
      setUserName("");
      setUserEmail("");
      initChat();
    }
  };

  const handleCopy = (text: string, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedMessageIndex(index);
          setCopyAnnouncement("Message copied to clipboard.");
          setTimeout(() => {
            setCopiedMessageIndex(null);
            setCopyAnnouncement("");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text:", err);
          setCopyAnnouncement("Failed to copy message.");
          setTimeout(() => setCopyAnnouncement(""), 2000);
        });
    }
  };

  const handleRequestQuote = () => {
    setMessages((prev) => [
      ...prev,
      {
        text: "To provide you with a service quote, please fill out the form below. This information will be sent to our legal team for review.",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setShowQuoteForm(true);
    setTimeout(() => {
      formContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleQuoteSubmit = (formData: QuoteFormData) => {
    const chatHistory = formatMessagesForEmail(messages);
    const mailtoBody = `Dear Duran & Duran-Schulze Law Team,\n\nPlease see the service quote request below.\n\n--- Client Details ---\nName: ${formData.name}\nEmail: ${formData.email}\nContact Number: ${formData.contact}\n\nSummary of Concerns:\n${formData.summary}\n\n--- Chat Transcript ---\n${chatHistory}`;

    const mailtoLink = `mailto:info@duranschulze.com?subject=${encodeURIComponent("Service Quote Request")}&body=${encodeURIComponent(mailtoBody)}`;
    window.location.href = mailtoLink;

    setShowQuoteForm(false);
    setMessages((prev) => [
      ...prev,
      {
        text: "Thank you. Your request has been prepared to be sent via your email client. Please review the details and click send. Our team will get back to you shortly. You may continue our chat here.",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const handleQuoteCancel = () => {
    setShowQuoteForm(false);
    setMessages((prev) => [
      ...prev,
      {
        text: "Quote request cancelled. You can continue asking about legal processes.",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const handleScroll = () => {
    const el = chatWindowRef.current;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
      if (isAtBottom) {
        setShowScrollToBottom(false);
      }
    }
  };

  const handleScrollToBottom = () => {
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="app-container">
      <div className="visually-hidden" aria-live="assertive" role="alert">
        {copyAnnouncement}
      </div>
      <header className="header">
        <div className="header-content">
          <h1>Duran & Duran-Schulze Law</h1>
          <p>Legal AI Assistant</p>
        </div>
        <button
          onClick={handleNewInquiry}
          className="new-inquiry-btn"
          title="Start New Inquiry"
          aria-label="Start New Inquiry"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill="currentColor"
          >
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </header>
      <div className="chat-window-container">
        <div
          className="chat-window"
          ref={chatWindowRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-wrapper ${msg.sender}-wrapper`}
            >
              <div className={`message ${msg.sender}-message`} role="article">
                {(msg.sender === "ai" || msg.sender === "error") &&
                  msg.text && (
                    <button
                      onClick={() => handleCopy(msg.text, index)}
                      className="copy-button"
                      aria-label="Copy message"
                    >
                      {copiedMessageIndex === index ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 0 24 24"
                          width="24px"
                          fill="currentColor"
                        >
                          <path d="M0 0h24v24H0V0z" fill="none" />
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 0 24 24"
                          width="24px"
                          fill="currentColor"
                        >
                          <path d="M0 0h24v24H0V0z" fill="none" />
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                      )}
                    </button>
                  )}
                {renderMessageWithLinks(msg.text)}
              </div>
              <time className="timestamp">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper ai-wrapper">
              <div
                className="message ai-message"
                role="status"
                aria-label="AI is typing"
              >
                <div className="loading-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <span className="typing-text">AI is typing...</span>
              </div>
            </div>
          )}
        </div>
        {showScrollToBottom && (
          <button
            onClick={handleScrollToBottom}
            className="scroll-to-bottom-btn"
            aria-label="Scroll to new messages"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 0 24 24"
              width="24px"
              fill="currentColor"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
            <span>New Messages</span>
          </button>
        )}
      </div>
      <div className="input-form-container" ref={formContainerRef}>
        {!userIdentified ? (
          <IdentificationForm onSubmit={handleIdentificationSubmit} />
        ) : showQuoteForm ? (
          <QuoteForm
            onSubmit={handleQuoteSubmit}
            onCancel={handleQuoteCancel}
            initialData={{ name: userName, email: userEmail }}
          />
        ) : (
          <form className="input-form" onSubmit={handleSendMessage}>
            <input
              ref={chatInputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about a legal process..."
              aria-label="Your legal question"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              aria-label="Send Message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </form>
        )}
      </div>
      <footer className="footer">
        <div className="footer-content">
          <div className="consultation-container">
            <div className="consultation-block">
              <p>Expertise: Corporate, Tax, Venture Capital</p>
              <a
                href="https://tidycal.com/mariechristine"
                target="_blank"
                rel="noopener noreferrer"
                className="schedule-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm5 3h4v4h-4z" />
                </svg>
                Atty. Marie Christine
              </a>
            </div>
            <div className="consultation-block">
              <p>Expertise: Family, Civil, Property Law</p>
              <a
                href="https://tidycal.com/attymarywendy"
                target="_blank"
                rel="noopener noreferrer"
                className="schedule-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm5 3h4v4h-4z" />
                </svg>
                Atty. Mary Wendy
              </a>
            </div>
          </div>
        </div>
        {!showQuoteForm && userIdentified && (
          <div className="quote-request-container">
            <button
              onClick={handleRequestQuote}
              className="quote-button"
              disabled={isLoading}
            >
              Request a Service Quote
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
