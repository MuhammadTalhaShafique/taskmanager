// src/components/TodoItem.js
import React from "react";

const TodoItem = ({ todo, toggleComplete, deleteTodo, setEdit }) => {
  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-content">
        <h3>{todo.title}</h3>
        {todo.description && <p>{todo.description}</p>}
        <small>Created: {new Date(todo.createdAt).toLocaleString()}</small>
      </div>
      <div className="todo-actions">
        <button
          className="btn btn-sm"
          onClick={() => toggleComplete(todo._id, todo.completed)}
        >
          {todo.completed ? "Mark Incomplete" : "Mark Complete"}
        </button>
        <button className="btn btn-sm edit" onClick={() => setEdit(todo)}>
          Edit
        </button>
        <button
          className="btn btn-sm delete"
          onClick={() => deleteTodo(todo._id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
