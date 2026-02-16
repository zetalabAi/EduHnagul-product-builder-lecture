/**
 * Add Friend Modal Component
 * 3 methods: QR Code, Search, Invite Link
 */

"use client";

import { useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import { QRCodeScanner } from "./QRCodeScanner";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

type TabType = "qr" | "search" | "invite";

export function AddFriendModal({ isOpen, onClose, userId }: AddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("qr");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteLink, setInviteLink] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { addFriend, searchUsers, generateInviteLink } = useFriends(userId);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      alert("검색어는 최소 2자 이상 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      alert("검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    setIsLoading(true);
    try {
      await addFriend({ friendId });
      alert("친구가 추가되었습니다! 👥");
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      alert(error.message || "친구 추가에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    setIsLoading(true);
    try {
      const link = await generateInviteLink(10, 7);
      setInviteLink(link);
    } catch (error) {
      alert("초대 링크 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink.inviteUrl);
      alert("링크가 복사되었습니다! 📋");
    }
  };

  const handleQRScan = async (data: string) => {
    setIsLoading(true);
    try {
      await addFriend({ qrData: data });
      alert("친구가 추가되었습니다! 👥");
      setShowScanner(false);
    } catch (error: any) {
      alert(error.message || "QR 코드가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const myQRData = `eduhangul://add-friend/${userId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">친구 추가</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "qr"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              QR 코드
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "search"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              검색
            </button>
            <button
              onClick={() => setActiveTab("invite")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "invite"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              초대 링크
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* QR Code Tab */}
          {activeTab === "qr" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-white font-semibold mb-2">내 QR 코드</h3>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(myQRData)}`}
                    alt="My QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  친구에게 이 QR 코드를 보여주세요
                </p>
              </div>

              <hr className="border-gray-700" />

              <div>
                <h3 className="text-white font-semibold mb-2 text-center">
                  친구 QR 스캔
                </h3>
                {!showScanner ? (
                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                  >
                    📷 카메라로 스캔하기
                  </button>
                ) : (
                  <div>
                    <QRCodeScanner
                      onScan={handleQRScan}
                      onError={(error) => {
                        console.error(error);
                        alert("QR 코드 스캔에 실패했습니다.");
                      }}
                    />
                    <button
                      onClick={() => setShowScanner(false)}
                      className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  이름 또는 이메일로 검색
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="예: 김철수"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    검색
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-semibold">검색 결과</h3>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.displayName}
                          </p>
                          <p className="text-sm text-gray-400">
                            레벨 {user.level}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && (
                <p className="text-gray-400 text-center py-4">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          )}

          {/* Invite Link Tab */}
          {activeTab === "invite" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">초대 링크 생성</h3>
                <p className="text-gray-400 text-sm mb-4">
                  친구에게 공유할 수 있는 링크를 생성합니다. 링크는 7일간 유효하며
                  최대 10회 사용 가능합니다.
                </p>
                {!inviteLink ? (
                  <button
                    onClick={handleGenerateInviteLink}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    🔗 초대 링크 생성
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-2">초대 링크</p>
                      <p className="text-white font-mono text-sm break-all">
                        {inviteLink.inviteUrl}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCopyInviteLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                      >
                        📋 복사
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: "EduHangul 친구 초대",
                              text: "EduHangul에서 함께 한국어를 배워요!",
                              url: inviteLink.inviteUrl,
                            });
                          } else {
                            handleCopyInviteLink();
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                      >
                        📤 공유
                      </button>
                    </div>
                    <div className="text-gray-400 text-xs text-center">
                      만료: {new Date(inviteLink.expiresAt).toLocaleDateString()} | 사용: 0/{inviteLink.maxUses}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
