import React, { useState, useEffect, useCallback } from 'react';
import { Star, User, Edit2 } from 'lucide-react';
import authService from '../../services/authService';

const ReviewSection = ({ 
  reviews = [], 
  averageRating = 0,
  totalReviews = 0,
  canReview = false,
  currentUserId = null,
  onSubmitReview 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewUsers, setReviewUsers] = useState({});
  
  // Find current user's review
  const currentUserReview = reviews.find(r => r.userId === currentUserId);

  const loadReviewUsers = useCallback(async () => {
    const users = {};
    for (const review of reviews) {
      if (!users[review.userId]) {
        const user = await authService.getUser(review.userId);
        if (user) {
          users[review.userId] = user;
        }
      }
    }
    setReviewUsers(users);
  }, [reviews]);

  useEffect(() => {
    loadReviewUsers();
  }, [loadReviewUsers]);

  // Load current user's review into form if editing
  useEffect(() => {
    if (isEditing && currentUserReview) {
      setRating(currentUserReview.rating);
      setComment(currentUserReview.comment);
    }
  }, [isEditing, currentUserReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      console.warn('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!comment.trim()) {
      console.warn('Vui lòng nhập bình luận');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment);
      if (!currentUserReview) {
        // Only reset form if it's a new review
        setRating(0);
        setComment('');
      }
      setIsEditing(false);
      console.log('Đánh giá của bạn đã được gửi!');
    } catch (error) {
      console.error('Có lỗi xảy ra. Vui lòng thử lại.', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (currentUserReview) {
      setRating(currentUserReview.rating);
      setComment(currentUserReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  };

  const renderStars = (count, size = 20, interactive = false, onClick = null) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= count ? '#F59E0B' : 'none'}
            color={star <= count ? '#F59E0B' : '#D1D5DB'}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={() => interactive && onClick && onClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Rating Summary */}
      <div style={{
        padding: '24px',
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827' }}>
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), 24)}
            <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
              {totalReviews} đánh giá
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {canReview && (
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              {currentUserReview && !isEditing ? 'Đánh giá của bạn' : isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
            </h3>
            {currentUserReview && !isEditing && (
              <button
                onClick={handleEdit}
                type="button"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#4F46E5',
                  border: '1px solid #4F46E5',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit2 size={16} />
                Chỉnh sửa
              </button>
            )}
          </div>

          {(!currentUserReview || isEditing) && (
            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                Đánh giá của bạn
              </label>
              {renderStars(hoverRating || rating, 32, true, setRating)}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                Bình luận
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  backgroundColor: isSubmitting ? '#9CA3AF' : '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang gửi...' : (currentUserReview && isEditing ? 'Cập nhật' : 'Gửi đánh giá')}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
          )}

          {/* Show current review when not editing */}
          {currentUserReview && !isEditing && (
            <div style={{ marginTop: '16px' }}>
              {renderStars(currentUserReview.rating, 24)}
              <p style={{ marginTop: '12px', color: '#374151', lineHeight: '1.6' }}>
                {currentUserReview.comment}
              </p>
              {currentUserReview.isEdited && (
                <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '8px', display: 'block' }}>
                  Đã chỉnh sửa
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Đánh giá từ người dùng
        </h3>

        {reviews.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            Chưa có đánh giá nào
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {reviewUsers[review.userId]?.avatar ? (
                      <img 
                        src={reviewUsers[review.userId].avatar} 
                        alt="Avatar"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <User size={20} color="#6B7280" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        {reviewUsers[review.userId]?.name || 'Người dùng'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {renderStars(review.rating, 16)}
                  </div>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6',
                  marginLeft: '52px'
                }}>
                  {review.comment}
                </p>
                {review.isEdited && (
                  <span style={{
                    fontSize: '13px',
                    color: '#9CA3AF',
                    fontStyle: 'italic',
                    marginLeft: '52px',
                    marginTop: '8px',
                    display: 'block'
                  }}>
                    Đã chỉnh sửa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;