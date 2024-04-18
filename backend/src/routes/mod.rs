pub mod analyze;
pub mod lookup;
pub mod word_status;

pub enum ApiResponse<T> {
    JsonData(T),
}
