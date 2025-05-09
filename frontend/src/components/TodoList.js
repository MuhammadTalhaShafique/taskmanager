// src/components/TodoList.js
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await api.get("/api/todos");
        setTodos(res.data);
      } catch (err) {
        toast.error("Failed to fetch todos");
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const addTodo = async (todo) => {
    try {
      const res = await api.post("/api/todos", todo);
      setTodos([res.data, ...todos]);
      toast.success("Todo added");
    } catch (err) {
      toast.error("Failed to add todo");
    }
  };

  const updateTodo = async (id, updatedTodo) => {
    try {
      const res = await api.put(`/api/todos/${id}`, updatedTodo);
      setTodos(todos.map((todo) => (todo._id === id ? res.data : todo)));
      setEditingTodo(null);
      toast.success("Todo updated");
    } catch (err) {
      toast.error("Failed to update todo");
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter((todo) => todo._id !== id));
      toast.success("Todo removed");
    } catch (err) {
      toast.error("Failed to delete todo");
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      const todo = todos.find((todo) => todo._id === id);
      const res = await api.put(`/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map((todo) => (todo._id === id ? res.data : todo)));
    } catch (err) {
      toast.error("Failed to update todo status");
    }
  };

  const setEdit = (todo) => {
    setEditingTodo(todo);
  };

  return (
    <div className="todo-container">
      <h1>Todos</h1>
      <TodoForm
        addTodo={addTodo}
        editingTodo={editingTodo}
        updateTodo={updateTodo}
        setEditingTodo={setEditingTodo}
      />

      {loading ? (
        <p>Loading todos...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet. Add one!</p>
      ) : (
        <div className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              toggleComplete={toggleComplete}
              deleteTodo={deleteTodo}
              setEdit={setEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
