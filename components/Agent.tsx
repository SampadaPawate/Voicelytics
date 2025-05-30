"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { configureAssistant} from "@/constants";

import { cn } from "@/lib/utils";
import { vapi, isVapiConfigured } from "@/lib/vapi.sdk";

interface SavedMessage {
    role:'user'|'system'|'assistant';
    content: string;
}

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

const Agent = ({
                   userName,
                   userId,
                   interviewId,
                   feedbackId,
                   type,
                   questions = [],
               }: AgentProps) => {
    // const router = useRouter();
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Check for required props
    useEffect(() => {
        if (!userName) {
            console.warn("Agent component: userName prop is required");
            setError("User information is missing");
        }
        if (!type) {
            console.warn("Agent component: type prop is required");
            setError("Interview type is missing");
        }
    }, [userName, type]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: any) => {
            try {
                if (message.type === "transcript" && message.transcriptType === "final") {
                    const newMessage = { 
                        role: message.role || 'assistant', 
                        content: message.transcript || ''
                    };
                    setMessages((prev) => [...prev, newMessage]);
                    setLastMessage(message.transcript || '');
                }
            } catch (error) {
                console.error("Error processing message:", error, message);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => console.error("Error:", error);

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, []);

    // useEffect(() => {
    //     if (callStatus === CallStatus.FINISHED) router.push("/");
    // }, [messages, callStatus, type, userId]);

    const handleCall = async () => {
        // Reset any previous errors
        setError(null);

        // Check if VAPI is properly configured
        if (!isVapiConfigured()) {
            const errorMsg = "VAPI is not properly configured. Please check your environment variables.";
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        // Check for required props again
        if (!userName) {
            setError("User information is missing");
            return;
        }

        if (!type) {
            setError("Interview type is missing");
            return;
        }

        setCallStatus(CallStatus.CONNECTING);

        const assistantOverride = {
            variableValues: {
                userName, userId, interviewId, feedbackId, type, questions,
            },
            clientMessages: ["transcript"],
            serverMessages: [],
        }

        try {
            const assistant = configureAssistant(userName, userId, interviewId, feedbackId, type, questions);

            // Add error handler for connection issues
            const errorHandler = (err: any) => {
                console.error("VAPI connection error:", err);
                setError("Failed to connect to VAPI. Please check your internet connection and try again.");
                setCallStatus(CallStatus.INACTIVE);
            };

            // Add one-time error handler for this specific call
            vapi.once("error", errorHandler);

            // Start the call
            //@ts-expect-error
            vapi.start(assistant, assistantOverride);

            // Set a timeout to detect if connection is taking too long
            const connectionTimeout = setTimeout(() => {
                if (callStatus === CallStatus.CONNECTING) {
                    setError("Connection timeout. VAPI service might be unavailable.");
                    setCallStatus(CallStatus.INACTIVE);
                    vapi.off("error", errorHandler);
                }
            }, 10000); // 10 seconds timeout

            // Clean up the timeout when component unmounts or call status changes
            return () => {
                clearTimeout(connectionTimeout);
                vapi.off("error", errorHandler);
            };
        } catch (error) {
            console.error("Error starting VAPI:", error);
            setCallStatus(CallStatus.INACTIVE);
            setError("Failed to start VAPI call. Please try again.");
        }
    }


    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    };

    const latestMessage = messages[messages.length - 1]?.content;

    const isCallInactiveOrFinished =
        callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="profile-image"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.png"
                            alt="profile-image"
                            width={539}
                            height={539}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>




                {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={latestMessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fade-in opacity-100"
                            )}
                        >
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button 
                        className="relative btn-call" 
                        onClick={handleCall}
                        disabled={!!error || callStatus === CallStatus.CONNECTING}
                    >
                        <span
                            className={cn(
                                "absolute animate-ping rounded-full opacity-75",
                                callStatus !== CallStatus.CONNECTING && "hidden"
                            )}
                        />
                        <span>
                            {error ? "Cannot Connect" : 
                             callStatus === CallStatus.CONNECTING ? "Connecting..." : 
                             "Call"}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>

            {/* Connection status message */}
            {callStatus === CallStatus.CONNECTING && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    Connecting to VAPI...
                </div>
            )}
        </>
    );
};

export default Agent;
