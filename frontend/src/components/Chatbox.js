import { Box } from "@chakra-ui/layout";
import { ChatState } from "../Context/ChatProvider";

import SingleChat from "./SingleChat";

const Chatbox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <Box
      d={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="white"
      w={{ base: "100%", md: "80%" }} /* Increase width to 80% */
      h="90vh" /* Increase height to 90% of viewport height */
      borderRadius="lg"
      borderWidth="1px"
      overflow-y = "scroll"
    >
    <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}> </SingleChat>
    </Box>
  );
};

export default Chatbox;
