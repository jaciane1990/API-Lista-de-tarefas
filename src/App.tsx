import { useEffect, useState } from "react";
import "./App.css";

interface User {
  id: number;
  name: string;
}

interface Task {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const [usersRes, tasksRes] = await Promise.all([
          fetch("https://jsonplaceholder.typicode.com/users"),
          fetch("https://jsonplaceholder.typicode.com/todos"),
        ]);
        if (!usersRes.ok || !tasksRes.ok) throw new Error("Erro ao buscar dados");

        const usersData: User[] = await usersRes.json();
        const tasksData: Task[] = await tasksRes.json();

        setUsers(usersData);
        setTasks(tasksData);
        setSelectedUserId(usersData[0]?.id || null);
      } catch (err) {
        setError("Erro ao carregar dados, tente novamente.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const startLoading = (id: number) => setLoadingIds((prev) => [...prev, id]);
  const stopLoading = (id: number) =>
    setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));

  async function toggleTask(taskId: number, currentStatus: boolean) {
    startLoading(taskId);
    setError(null);
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar tarefa");

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        )
      );
    } catch {
      setError("Erro ao atualizar tarefa, tente novamente.");
    } finally {
      stopLoading(taskId);
    }
  }

  async function deleteTask(taskId: number) {
    startLoading(taskId);
    setError(null);
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir tarefa");

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch {
      setError("Erro ao excluir tarefa, tente novamente.");
    } finally {
      stopLoading(taskId);
    }
  }

  if (loadingData) {
    return <div className="loading">Carregando dados...</div>;
  }

  return (
    <div className="container">
      {/* Menu lateral */}
      <nav className="sidebar">
        <h2 className="sidebar-title">Usuários</h2>
        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id}>
              <button
                className={`user-btn ${user.id === selectedUserId ? "active" : ""}`}
                onClick={() => setSelectedUserId(user.id)}
              >
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Conteúdo principal */}
      <main className="main-content">
        <h1 className="main-title">Gerenciador de Tarefas</h1>

        {error && <div className="error-message">{error}</div>}

        {selectedUserId !== null && (
          <>
            <h2 className="tasks-title">
              Tarefas de {users.find((u) => u.id === selectedUserId)?.name}
            </h2>
            <ul className="task-list">
              {tasks
                .filter((task) => task.userId === selectedUserId)
                .map((task) => {
                  const isLoading = loadingIds.includes(task.id);
                  return (
                    <li
                      key={task.id}
className="task-item"
                    >
                     <label className="task-label">
  <input
    type="checkbox"
    checked={task.completed}
    disabled={isLoading}
    onChange={() => toggleTask(task.id, task.completed)}
  />
  <span className={task.completed ? "completed" : ""}>
    {task.title}
  </span>
</label>

                      <button
                        className="delete-btn"
                        onClick={() => deleteTask(task.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Excluindo..." : "Excluir"}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
