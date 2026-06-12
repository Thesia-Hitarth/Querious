import React from "react";
import { motion } from "framer-motion";
import Questions from "./Questions";

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const QuestionList = ({ questionsList }) => {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {questionsList.map((question) => (
        <motion.div key={question._id} variants={itemVariants}>
          <Questions question={question} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(QuestionList);
