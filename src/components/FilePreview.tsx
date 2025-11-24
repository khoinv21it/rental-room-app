import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileId?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileUrl,
  fileName,
  fileId,
}) => {
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    fileUrl
  )}&embedded=true`;

  const handleViewFile = () => {
    Linking.openURL(googleViewerUrl).catch(() => {
      Linking.openURL(fileUrl).catch(() => {
        alert("Cannot open file");
      });
    });
  };

  return (
    <View style={styles.fileCard}>
      <View style={styles.fileInfo}>
        <View style={styles.fileIconContainer}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={32}
            color="#6366f1"
          />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName}>{fileName || "No file available"}</Text>
          {fileId && <Text style={styles.fileId}>{fileId}</Text>}
        </View>
      </View>
      {fileUrl && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleViewFile}
        >
          <Ionicons name="eye-outline" size={20} color="#fff" />
          <Text style={styles.downloadText}>View File</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  fileId: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default FilePreview;
