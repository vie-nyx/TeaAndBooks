export default function ReviewsTab({ reviews, reviewDraft, setReviewDraft, onCreateReview }) {
  return (
    <div className="profile-tab-panel">
      <div className="review-create-card">
        <input
          placeholder="Book title"
          value={reviewDraft.title}
          onChange={(e) => setReviewDraft((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          placeholder="Write your review..."
          value={reviewDraft.content}
          onChange={(e) => setReviewDraft((prev) => ({ ...prev, content: e.target.value }))}
        />
        <div className="review-create-row">
          <input
            type="number"
            min="1"
            max="5"
            value={reviewDraft.rating}
            onChange={(e) => setReviewDraft((prev) => ({ ...prev, rating: e.target.value }))}
          />
          <button type="button" onClick={onCreateReview}>
            Publish Review
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="review-card">
            <h4>{review.title}</h4>
            <p>{review.content}</p>
            <span>Rating: {review.rating}/5</span>
          </div>
        ))
      )}
    </div>
  );
}
