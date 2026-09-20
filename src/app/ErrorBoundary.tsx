import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="main"><section className="glass card stack" role="alert"><h1>Không thể hiển thị màn hình</h1><p>Ứng dụng gặp lỗi. Hãy tải lại trang để khôi phục phiên.</p><button className="btn primary" onClick={()=>window.location.reload()}>Tải lại trang</button></section></main>:this.props.children;}
}
