import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import { Box, Flex, Text, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from '../config/ChatLogics';
import ProfileModal from './miscellaneous/ProfileModal';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupModal';
import { FormControl, Input } from '@chakra-ui/react';
import axios from 'axios';
import "./styles.css"
import ScrollableChat from './ScrollableChat';
import io from "socket.io-client"
import Lottie from "react-lottie";
import animationData from "../animations/typing.json"

const ENDPOINT  = "http://localhost:5000"
var socket, selectedChatCompare

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  

    
    useEffect(() => {
      socket = io(ENDPOINT)
      socket.emit("setup" , user)
      socket.on("Connected", ()=> setSocketConnected(true))
      socket.on("typing", () => setIsTyping(true))
      socket.on("stop typing", () => setIsTyping(false))


    }, [])

    const { user, selectedChat, setSelectedChat, notification, setNotification } = ChatState();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const toast = useToast();
    const [socketConnected, setSocketConnected] = useState(false)
    const [typing, setTyping] = useState(false)
    const [isTyping, setIsTyping] = useState(false)

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
    },
  };

    const fetchMessages = async () => {
      if(!selectedChat) return;

      try{
          const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setLoading(true)
        const { data } = await axios.get(
          `/api/message/${selectedChat._id}`,

          config
        );
        setMessages(data)
        setLoading(false)
        socket.emit("join chat" , selectedChat._id)

      }catch(error){
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }

    }

    useEffect(() =>{
      fetchMessages()
      selectedChatCompare = selectedChat

    },[selectedChat])

    console.log(notification, "-------------------------------")

    useEffect(() => {
      socket.on("message recieved", (newMessageRecieved) => {
        if(!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id)
        {
          if(!notification.includes(newMessageRecieved)){
            setNotification([newMessageRecieved, ...notification])
            setFetchAgain(!fetchAgain)
          }
        }
        else {
          setMessages([...messages, newMessageRecieved])
        }
      } )
    
    })

    const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing" , selectedChat._id)
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );
        console.log(data);
        socket.emit("new message",data)
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

    const typingHandler = (e) => {
      setNewMessage(e.target.value);

      if(!socketConnected) return

      if(!typing){
        setTyping(true)
        socket.emit("typing" , selectedChat._id)
      }
      let lastTypingTime = new Date().getTime()
      var timeLength  = 3000
      setTimeout(() => {
        var timeNow = new Date().getTime()
        var timeDiff = timeNow - lastTypingTime

        if(timeDiff >= timeLength && typing)
        {
          socket.emit("stop typing" , selectedChat._id)
          setTyping(false)
        }
      }, timeLength)

    };

    return (
    <div>
      {selectedChat ? (
        <>
        <Text
          fontSize={{ base: "28px", md: "30px" }}
          pb={3}
          px={2}
          w="100%"
          fontFamily="Work sans"
          d="flex"
          justifyContent={{ base: "space-between" }}
          alignItems="center"
        >
          {!selectedChat.isGroupChat ? (
            <>
              {getSender(user,selectedChat.users)}
              <ProfileModal user={getSenderFull(user,selectedChat.users)}/>
            </>
          ) : (
            <>
              {selectedChat.chatName.toUpperCase()}
              <UpdateGroupChatModal
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                fetchMessages={fetchMessages}
              />
            </>
          )}
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%" /* Increase width to 80% */
            h="80vh" /* Increase height to 90% of viewport height */
            borderRadius="lg"
            overflowY="scroll"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages = {messages} />

              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              isRequired
              mt={3}
            >
              {isTyping?<div>
                <Lottie 
                options={defaultOptions}
                width={70}
                style={{}}
                
                
                />
              </div>:(<> </>)}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
                style={{
                position: "relative",
                bottom: 0,
                left: 0,
                zIndex: 999 // adjust z-index if necessary
                }}
              />
            </FormControl>
          </Box>
        </Text>
        </>
      ) : (
        <Flex alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Flex>
      )}
    </div>
  );
};

export default SingleChat;
