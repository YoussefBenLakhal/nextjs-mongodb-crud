"use client";

import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function StudentAttendancePage() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/student");
        setStudent(res.data);
      } catch (error) {
        console.error("Erreur de chargement des données :", error);
      }
    };

    fetchData();
  }, []);

  if (!student || !student.attendance) {
    return (
      <Box p={6}>
        <Heading size="lg" mb={4}>Historique de présence</Heading>
        <Text color="red.500">Aucune donnée de présence disponible.</Text>
      </Box>
    );
  }

  const attendanceEntries = Object.entries(student.attendance);

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Historique de présence</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Matière</Th>
            <Th>Statut</Th>
          </Tr>
        </Thead>
        <Tbody>
          {attendanceEntries.map(([date, entry]) => (
            <Tr key={date}>
              <Td>{date}</Td>
              <Td>{entry.subject}</Td>
              <Td color={entry.status === "present" ? "green.500" : "red.500"} fontWeight="bold">
                {entry.status === "present" ? "Présent" : "Absent"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
