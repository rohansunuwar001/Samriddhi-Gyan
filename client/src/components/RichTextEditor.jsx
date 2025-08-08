import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
const RichTextEditor = ({ value, onChange }) => {
  return <ReactQuill theme="snow" value={value} onChange={onChange} />;
};

RichTextEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
export default RichTextEditor;