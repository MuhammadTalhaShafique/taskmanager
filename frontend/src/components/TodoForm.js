// src/components/TodoForm.js
import React, { useState, useEffect } from "react";

const TodoForm = ({ addTodo, editingTodo, updateTodo, setEditingTodo }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title,
        description: editingTodo.description || "",
      });
    }
  }, [editingTodo]);

  const { title, description } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (editingTodo) {
      updateTodo(editingTodo._id, formData);
    } else {
      addTodo(formData);
    }

    // Reset form
    setFormData({ title: "", description: "" });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setFormData({ title: "", description: "" });
  };

  return (
    <div className="todo-form">
      <h3>{editingTodo ? "Edit Todo" : "Add Todo"}</h3>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            name="title"
            id="title"
            value={title}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            name="description"
            id="description"
            value={description}
            onChange={onChange}
            rows="3"
          ></textarea>
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {editingTodo ? "Update" : "Add"}
          </button>
          {editingTodo && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
