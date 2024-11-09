import { CloseIcon } from "@chakra-ui/icons";
import { Box } from "@chakra-ui/react";
import React from "react";

const UserBadgeItem = ({ user, handleFunction }) => {
  return (
    <div>
      <Box
        px={2}
        py={1}
        bg="purple"
        color={"white"}
        borderRadius={"lg"}
        m={1}
        mb={2}
        fontSize={12}
        cursor={"pointer"}
        onClick={handleFunction}
      >
        {user.name}
        <CloseIcon pl={1} />
      </Box>
    </div>
  );
};

export default UserBadgeItem;
