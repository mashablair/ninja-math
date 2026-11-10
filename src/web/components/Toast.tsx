export const Toast=({message}:{message:string})=><div className="toast" role="status" hidden={!message}>{message}</div>;
